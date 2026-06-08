import { beforeEach, describe, expect, test, vi } from "vitest";
import { prisma as originalPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { linkPlayerAction, addPlayerAction } from "@/actions/players";
import { addCertificateAction } from "@/actions/certificates";

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe("Phase 2 Auth And Invariant Guards", () => {
  beforeEach(() => {
    prisma.$transaction.mockImplementation(async (callback) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }

      return [];
    });
  });

  test("menggagalkan linking pemain jika akun tujuan bukan parent aktif", async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(linkPlayerAction("player-1", "user-non-parent")).rejects.toThrow(
      "Akun orang tua tujuan tidak ditemukan atau sudah tidak aktif.",
    );
  });

  test("menggagalkan sertifikat jika pemain target tidak ditemukan", async () => {
    prisma.player.findFirst.mockResolvedValue(null);

    await expect(
      addCertificateAction({
        title: "MVP",
        fileUrl: "https://example.com/file.pdf",
        playerId: "missing-player",
      }),
    ).rejects.toThrow("Pemain tidak ditemukan atau sudah dihapus.");
  });

  test("menggagalkan pembuatan pemain jika group target tidak ditemukan", async () => {
    prisma.group.findUnique.mockResolvedValue(null);

    await expect(
      addPlayerAction({
        firstName: "Ananta",
        lastName: "Raihan",
        dateOfBirth: "2010-01-01",
        groupId: "missing-group",
      }),
    ).rejects.toThrow("Kelompok latihan tidak ditemukan.");
  });
});

describe("Phase 1 Production Maturity: Storage ACL Ownership", () => {
  const mockLookup = {
    findCoachAsset: vi.fn(),
    findCoachLicense: vi.fn(),
    findPlayerAsset: vi.fn(),
    findCertificate: vi.fn(),
    findReportArchive: vi.fn(),
    isCoachVisibleToParent: vi.fn(),
    isPlayerOwnedByParent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("mengembalikan 403 jika parent mengakses arsip rapor pemain milik parent lain", async () => {
    const { authorizePrivateStorageAccess } = await import("@/lib/storage-acl");

    mockLookup.findReportArchive.mockResolvedValue({ id: "rapor-1", playerId: "player-lain" });
    // Simulasi isPlayerOwnedByParent me-return false
    mockLookup.isPlayerOwnedByParent.mockResolvedValue(false);

    const decision = await authorizePrivateStorageAccess({
      role: "PARENT",
      userId: "parent-1",
      fileUrl: "https://example.com/rapor.pdf",
      lookup: mockLookup,
    });

    expect(decision).toEqual({
      allowed: false,
      statusCode: 403,
      message: "Arsip rapor ini bukan milik akun parent ini.",
    });
  });

  test("mengembalikan 200 jika parent mengakses arsip rapor pemain miliknya sendiri", async () => {
    const { authorizePrivateStorageAccess } = await import("@/lib/storage-acl");

    mockLookup.findReportArchive.mockResolvedValue({ id: "rapor-2", playerId: "player-sendiri" });
    mockLookup.isPlayerOwnedByParent.mockResolvedValue(true);

    const decision = await authorizePrivateStorageAccess({
      role: "PARENT",
      userId: "parent-2",
      fileUrl: "https://example.com/rapor2.pdf",
      lookup: mockLookup,
    });

    expect(decision).toEqual({
      allowed: true,
      statusCode: 200,
      message: "allowed",
    });
  });
});
