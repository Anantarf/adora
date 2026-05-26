-- CreateEnum
CREATE TYPE "operational_severity" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "OperationalEvent" (
    "id" TEXT NOT NULL,
    "severity" "operational_severity" NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "fingerprint" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationalEvent_createdAt_idx" ON "OperationalEvent"("createdAt");

-- CreateIndex
CREATE INDEX "OperationalEvent_severity_createdAt_idx" ON "OperationalEvent"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "OperationalEvent_source_createdAt_idx" ON "OperationalEvent"("source", "createdAt");

-- CreateIndex
CREATE INDEX "OperationalEvent_fingerprint_idx" ON "OperationalEvent"("fingerprint");
