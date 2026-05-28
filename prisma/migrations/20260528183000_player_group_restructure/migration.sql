CREATE TYPE "group_category" AS ENUM ('SEKOLAH', 'KELOMPOK_UMUR');

ALTER TABLE "Group"
  ADD COLUMN "category" "group_category" NOT NULL DEFAULT 'KELOMPOK_UMUR',
  ADD COLUMN "targetKu" INTEGER,
  ADD COLUMN "schoolLevel" TEXT;

UPDATE "Group"
SET
  "category" = CASE
    WHEN "description" IS NOT NULL AND "description" LIKE '{%' AND COALESCE("description"::jsonb ->> 'schoolLevel', '') <> '' THEN 'SEKOLAH'::"group_category"
    ELSE 'KELOMPOK_UMUR'::"group_category"
  END,
  "targetKu" = CASE
    WHEN "description" IS NOT NULL AND "description" LIKE '{%' AND COALESCE("description"::jsonb ->> 'targetKu', '') ~ '^[0-9]+$'
      THEN ("description"::jsonb ->> 'targetKu')::INTEGER
    ELSE NULL
  END,
  "schoolLevel" = CASE
    WHEN "description" IS NOT NULL AND "description" LIKE '{%' AND COALESCE("description"::jsonb ->> 'schoolLevel', '') <> ''
      THEN "description"::jsonb ->> 'schoolLevel'
    ELSE NULL
  END;

ALTER TABLE "Player"
  ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "religion" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "province" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "ktpAddress" TEXT,
  ADD COLUMN "hasMedicalCondition" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "medicalConditionDetail" TEXT,
  ADD COLUMN "instagram" TEXT,
  ADD COLUMN "signatureUrl" TEXT;

UPDATE "Player"
SET
  "firstName" = CASE
    WHEN POSITION(' ' IN BTRIM("name")) > 0 THEN SPLIT_PART(BTRIM("name"), ' ', 1)
    ELSE BTRIM("name")
  END,
  "lastName" = CASE
    WHEN POSITION(' ' IN BTRIM("name")) > 0
      THEN BTRIM(SUBSTRING(BTRIM("name") FROM LENGTH(SPLIT_PART(BTRIM("name"), ' ', 1)) + 1))
    ELSE ''
  END,
  "addressLine1" = NULLIF(BTRIM(COALESCE("address", '')), ''),
  "hasMedicalCondition" = CASE
    WHEN NULLIF(BTRIM(COALESCE("medicalHistory", '')), '') IS NOT NULL THEN true
    ELSE false
  END,
  "medicalConditionDetail" = NULLIF(BTRIM(COALESCE("medicalHistory", '')), '');
