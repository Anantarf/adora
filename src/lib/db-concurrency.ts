import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SERIALIZABLE_RETRY_LIMIT = 3;

function isRetryableTransactionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    return true;
  }

  if (error instanceof Error) {
    const cause = (error as Error & { cause?: { originalCode?: string; kind?: string } }).cause;
    return cause?.originalCode === "40001" || cause?.kind === "TransactionWriteConflict";
  }

  return false;
}

export async function withSerializableTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await prisma.$transaction(
        async (tx) => operation(tx),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt >= SERIALIZABLE_RETRY_LIMIT) {
        throw error;
      }

      attempt += 1;
    }
  }
}

export async function acquireAdvisoryLock(tx: Prisma.TransactionClient, key: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}
