import { beforeEach, describe, expect, test } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { prisma as originalPrisma } from "@/lib/prisma";
import { clearBucket, consumeFixedWindowLimit, getActiveBucket, incrementBucket } from "@/lib/shared-rate-limit";

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;

describe("Shared rate limit helpers", () => {
  beforeEach(() => {
    prisma.rateLimitBucket.findUnique.mockReset();
    prisma.rateLimitBucket.deleteMany.mockReset();
    prisma.$queryRaw.mockReset();
  });

  test("mengabaikan bucket yang sudah kedaluwarsa", async () => {
    prisma.rateLimitBucket.findUnique.mockResolvedValue({
      id: "bucket-1",
      namespace: "upload-api",
      key: "127.0.0.1",
      count: 10,
      resetAt: new Date(Date.now() - 1_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    await expect(getActiveBucket("upload-api", "127.0.0.1")).resolves.toBeNull();
  });

  test("mengembalikan hasil upsert bucket dari query ringan", async () => {
    const resetAt = new Date(Date.now() + 60_000);
    prisma.$queryRaw.mockResolvedValue([{ count: 2, resetAt }] as never);

    await expect(incrementBucket("upload-api", "127.0.0.1", 60_000)).resolves.toEqual({
      count: 2,
      resetAt,
    });
  });

  test("menentukan allowance dari count bucket", async () => {
    const resetAt = new Date(Date.now() + 60_000);
    prisma.$queryRaw.mockResolvedValue([{ count: 4, resetAt }] as never);

    await expect(consumeFixedWindowLimit("upload-api", "127.0.0.1", 3, 60_000)).resolves.toEqual({
      allowed: false,
      count: 4,
      resetAt,
    });
  });

  test("membersihkan bucket berdasarkan namespace dan key", async () => {
    prisma.rateLimitBucket.deleteMany.mockResolvedValue({ count: 1 } as never);

    await clearBucket("login-failures", "127.0.0.1");

    expect(prisma.rateLimitBucket.deleteMany).toHaveBeenCalledWith({
      where: { namespace: "login-failures", key: "127.0.0.1" },
    });
  });
});
