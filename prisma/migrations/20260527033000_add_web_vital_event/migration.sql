CREATE TABLE "WebVitalEvent" (
    "id" TEXT NOT NULL,
    "metricId" TEXT,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "navigationType" TEXT,
    "pathname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebVitalEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebVitalEvent_createdAt_idx" ON "WebVitalEvent"("createdAt");
CREATE INDEX "WebVitalEvent_name_rating_idx" ON "WebVitalEvent"("name", "rating");
CREATE INDEX "WebVitalEvent_pathname_idx" ON "WebVitalEvent"("pathname");
