import { beforeEach, describe, expect, test, vi } from "vitest";
import { prisma as originalPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { getPlayersAction } from "@/actions/players";
import { getGroupsAction } from "@/actions/groups";

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe("Phase 1 Production Maturity: Failure Paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default transaction mock to pass through
    prisma.$transaction.mockImplementation(async (callback) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }
      return [];
    });
  });

  test("mengembalikan error wajar saat database timeout pada query pemain", async () => {
    // Simulasikan Prisma request timeout (P2024 atau generic error)
    prisma.player.findMany.mockRejectedValue(new Error("PrismaClientKnownRequestError: P2024: Timed out fetching a new connection from the connection pool"));

    // Action harus me-lempar error (karena error tidak tertangkap atau ditangkap & dilempar ulang)
    // Asumsinya kita hanya ingin memastikan server tidak crash dan error diteruskan ke tRPC/Server Action layer
    await expect(getPlayersAction()).rejects.toThrow();
  });

  test("mengembalikan error wajar saat database timeout pada query kelompok", async () => {
    prisma.group.findMany.mockRejectedValue(new Error("Database connection lost"));

    await expect(getGroupsAction()).rejects.toThrow();
  });
});
