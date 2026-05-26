import { prisma } from "@/lib/prisma";
import { acquireAdvisoryLock, withSerializableTransaction } from "@/lib/db-concurrency";

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

export async function incrementBucket(namespace: string, key: string, windowMs: number): Promise<BucketState> {
  return withSerializableTransaction(async (tx) => {
    await acquireAdvisoryLock(tx, `rate-limit:${namespace}:${key}`);

    const now = new Date();
    const existing = await tx.rateLimitBucket.findUnique({
      where: {
        namespace_key: { namespace, key },
      },
    });

    if (!existing || existing.resetAt.getTime() <= now.getTime()) {
      const resetAt = new Date(now.getTime() + windowMs);
      const bucket = await tx.rateLimitBucket.upsert({
        where: {
          namespace_key: { namespace, key },
        },
        update: {
          count: 1,
          resetAt,
        },
        create: {
          namespace,
          key,
          count: 1,
          resetAt,
        },
      });

      return { count: bucket.count, resetAt: bucket.resetAt };
    }

    const bucket = await tx.rateLimitBucket.update({
      where: {
        namespace_key: { namespace, key },
      },
      data: {
        count: { increment: 1 },
      },
    });

    return { count: bucket.count, resetAt: bucket.resetAt };
  });
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
