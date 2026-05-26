import { beforeEach, describe, expect, test } from "vitest";
import { prisma as originalPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { linkPlayerAction } from "@/actions/players";
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

  test("menggagalkan sertifikat jika group target tidak ditemukan", async () => {
    prisma.group.findUnique.mockResolvedValue(null);

    await expect(
      addCertificateAction({
        title: "Best Team",
        fileUrl: "https://example.com/file.pdf",
        groupId: "missing-group",
      }),
    ).rejects.toThrow("Kelompok latihan tidak ditemukan.");
  });
});
