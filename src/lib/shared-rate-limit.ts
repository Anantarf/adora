import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type BucketState = {
  count: number;
  resetAt: Date;
};

export async function getActiveBucket(namespace: string, key: string): Promise<BucketState | null> {
  const bucket = await prisma.rateLimitBucket.findUnique({
    where: {
      namespace_key: { namespace, key },
    },
  });

  if (!bucket || bucket.resetAt.getTime() <= Date.now()) {
    return null;
  }

  return { count: bucket.count, resetAt: bucket.resetAt };
}

export async function clearBucket(namespace: string, key: string) {
  await prisma.rateLimitBucket.deleteMany({
    where: { namespace, key },
  });
}

type BucketRow = {
  count: bigint | number;
  resetAt: Date;
};

export async function incrementBucket(namespace: string, key: string, windowMs: number): Promise<BucketState> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const bucketId = crypto.randomUUID();

  const rows = await prisma.$queryRaw<BucketRow[]>(Prisma.sql`
    INSERT INTO "RateLimitBucket" ("id", "namespace", "key", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (${bucketId}, ${namespace}, ${key}, 1, ${resetAt}, NOW(), NOW())
    ON CONFLICT ("namespace", "key")
    DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "resetAt"
  `);

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to increment rate limit bucket.");
  }

  return {
    count: typeof row.count === "bigint" ? Number(row.count) : row.count,
    resetAt: row.resetAt,
  };
}

export async function consumeFixedWindowLimit(
  namespace: string,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; count: number; resetAt: Date }> {
  const bucket = await incrementBucket(namespace, key, windowMs);

  return {
    allowed: bucket.count <= limit,
    count: bucket.count,
    resetAt: bucket.resetAt,
  };
}
