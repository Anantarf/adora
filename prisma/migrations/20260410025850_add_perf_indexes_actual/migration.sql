-- CreateIndex
CREATE INDEX `auditlog_timestamp_idx` ON `auditlog`(`timestamp`);

-- CreateIndex
CREATE INDEX `event_date_idx` ON `event`(`date`);

-- CreateIndex
CREATE INDEX `statistic_status_idx` ON `statistic`(`status`);
