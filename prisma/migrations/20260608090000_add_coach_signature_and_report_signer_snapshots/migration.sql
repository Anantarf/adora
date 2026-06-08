ALTER TABLE "CoachProfile"
ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;

ALTER TABLE "ReportArchive"
ADD COLUMN IF NOT EXISTS "coachSignUrlSnapshot" TEXT;

ALTER TABLE "statistic"
ADD COLUMN IF NOT EXISTS "coachSignUrlSnapshot" TEXT;
