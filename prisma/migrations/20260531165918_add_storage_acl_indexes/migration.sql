-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "firstName" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Player_photoUrl_idx" ON "Player"("photoUrl");

-- CreateIndex
CREATE INDEX "Player_signatureUrl_idx" ON "Player"("signatureUrl");

-- CreateIndex
CREATE INDEX "Certificate_fileUrl_idx" ON "certificate"("fileUrl");
