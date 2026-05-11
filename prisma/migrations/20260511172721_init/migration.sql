-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALPA');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'PARENT');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('LATIHAN', 'PERTANDINGAN', 'SPARING', 'EVALUASI', 'KHUSUS');

-- CreateEnum
CREATE TYPE "statistic_status" AS ENUM ('Draft', 'Published');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('PENDING', 'REVIEWED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Homebase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homebase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "attendance_status" NOT NULL,
    "note" TEXT,
    "playerId" TEXT NOT NULL,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditlog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetTable" TEXT NOT NULL,
    "recordId" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "auditlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerId" TEXT,
    "groupId" TEXT,

    CONSTRAINT "certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "event_type" NOT NULL DEFAULT 'LATIHAN',
    "location" TEXT,
    "homebaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGroup" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "EventGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "homebaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "placeOfBirth" TEXT,
    "gender" TEXT,
    "weight" TEXT,
    "height" TEXT,
    "schoolOrigin" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "medicalHistory" TEXT,
    "parentName" TEXT,
    "parentAddress" TEXT,
    "parentPhoneNumber" TEXT,
    "photoUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "groupId" TEXT,
    "parentId" TEXT,
    "preferredHomebaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistic" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "status" "statistic_status" NOT NULL DEFAULT 'Draft',
    "playerId" TEXT NOT NULL,
    "periodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatisticHistory" (
    "id" TEXT NOT NULL,
    "statisticId" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "status" "statistic_status" NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedBy" TEXT,

    CONSTRAINT "StatisticHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "username" TEXT,
    "password" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'PARENT',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificationtoken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "ageGroup" TEXT NOT NULL,
    "homebaseId" TEXT NOT NULL,
    "status" "registration_status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Homebase_name_key" ON "Homebase"("name");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "account"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "Attendance_eventId_idx" ON "attendance"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_playerId_date_key" ON "attendance"("playerId", "date");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "auditlog"("userId");

-- CreateIndex
CREATE INDEX "auditlog_timestamp_idx" ON "auditlog"("timestamp");

-- CreateIndex
CREATE INDEX "Certificate_groupId_idx" ON "certificate"("groupId");

-- CreateIndex
CREATE INDEX "Certificate_playerId_idx" ON "certificate"("playerId");

-- CreateIndex
CREATE INDEX "Event_homebaseId_idx" ON "Event"("homebaseId");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "EventGroup_eventId_idx" ON "EventGroup"("eventId");

-- CreateIndex
CREATE INDEX "EventGroup_groupId_idx" ON "EventGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "EventGroup_eventId_groupId_key" ON "EventGroup"("eventId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE INDEX "Group_homebaseId_idx" ON "Group"("homebaseId");

-- CreateIndex
CREATE INDEX "Player_groupId_idx" ON "Player"("groupId");

-- CreateIndex
CREATE INDEX "Player_parentId_idx" ON "Player"("parentId");

-- CreateIndex
CREATE INDEX "Player_preferred_homebaseId_idx" ON "Player"("preferredHomebaseId");

-- CreateIndex
CREATE INDEX "Player_isDeleted_idx" ON "Player"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_dateOfBirth_groupId_key" ON "Player"("name", "dateOfBirth", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "statistic_status_idx" ON "statistic"("status");

-- CreateIndex
CREATE INDEX "Statistic_periodId_idx" ON "statistic"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "Statistic_playerId_periodId_key" ON "statistic"("playerId", "periodId");

-- CreateIndex
CREATE INDEX "StatisticHistory_statisticId_idx" ON "StatisticHistory"("statisticId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "user"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "verificationtoken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "verificationtoken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Registration_homebaseId_idx" ON "Registration"("homebaseId");

-- CreateIndex
CREATE INDEX "Registration_status_idx" ON "Registration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClubSetting_key_key" ON "ClubSetting"("key");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "Attendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditlog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "Certificate_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "Certificate_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_homebaseId_fkey" FOREIGN KEY ("homebaseId") REFERENCES "Homebase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGroup" ADD CONSTRAINT "EventGroup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGroup" ADD CONSTRAINT "EventGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_homebaseId_fkey" FOREIGN KEY ("homebaseId") REFERENCES "Homebase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_preferred_homebaseId_fkey" FOREIGN KEY ("preferredHomebaseId") REFERENCES "Homebase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistic" ADD CONSTRAINT "Statistic_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistic" ADD CONSTRAINT "Statistic_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "EvaluationPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatisticHistory" ADD CONSTRAINT "StatisticHistory_statisticId_fkey" FOREIGN KEY ("statisticId") REFERENCES "statistic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatisticHistory" ADD CONSTRAINT "StatisticHistory_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_homebaseId_fkey" FOREIGN KEY ("homebaseId") REFERENCES "Homebase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
