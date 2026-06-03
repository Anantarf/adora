ALTER TYPE "user_role" ADD VALUE 'COACH';

CREATE TYPE "report_archive_status" AS ENUM ('DRAFT', 'RELEASED');

CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "placeOfBirth" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "photoUrl" TEXT,
    "licenseUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoachAssignment" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReportArchive" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "groupId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "status" "report_archive_status" NOT NULL DEFAULT 'DRAFT',
    "releasedAt" TIMESTAMP(3),
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportArchive_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");
CREATE INDEX "CoachProfile_isDeleted_idx" ON "CoachProfile"("isDeleted");

CREATE UNIQUE INDEX "CoachAssignment_groupId_key" ON "CoachAssignment"("groupId");
CREATE INDEX "CoachAssignment_coachProfileId_idx" ON "CoachAssignment"("coachProfileId");

CREATE UNIQUE INDEX "ReportArchive_playerId_periodId_key" ON "ReportArchive"("playerId", "periodId");
CREATE INDEX "ReportArchive_groupId_idx" ON "ReportArchive"("groupId");
CREATE INDEX "ReportArchive_periodId_idx" ON "ReportArchive"("periodId");
CREATE INDEX "ReportArchive_status_idx" ON "ReportArchive"("status");
CREATE INDEX "ReportArchive_uploadedById_idx" ON "ReportArchive"("uploadedById");

ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachAssignment" ADD CONSTRAINT "CoachAssignment_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachAssignment" ADD CONSTRAINT "CoachAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportArchive" ADD CONSTRAINT "ReportArchive_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportArchive" ADD CONSTRAINT "ReportArchive_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "EvaluationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportArchive" ADD CONSTRAINT "ReportArchive_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReportArchive" ADD CONSTRAINT "ReportArchive_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
