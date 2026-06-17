/**
 * Ambang batas alert operasional. Dipakai oleh scripts/check-observability-alerts.ts
 * dan dashboard observability. Override per-environment via env vars:
 *   ALERT_BAD_WEBVITALS_THRESHOLD
 *   ALERT_ERROR_EVENTS_THRESHOLD
 *   ALERT_WARN_EVENTS_THRESHOLD
 * (window observability alert saat ini default 1 jam, lihat check-observability-alerts.ts.)
 */
export const ALERT_THRESHOLDS = {
  badWebVitals: 50,
  errorEvents: 10,
  warnEvents: 25,
} as const;

export type AlertThresholdKey = keyof typeof ALERT_THRESHOLDS;

const ENV_KEYS: Record<AlertThresholdKey, string> = {
  badWebVitals: "ALERT_BAD_WEBVITALS_THRESHOLD",
  errorEvents: "ALERT_ERROR_EVENTS_THRESHOLD",
  warnEvents: "ALERT_WARN_EVENTS_THRESHOLD",
};

export function resolveAlertThreshold(key: AlertThresholdKey, env: NodeJS.ProcessEnv = process.env): number {
  const raw = env[ENV_KEYS[key]];
  const parsed = raw == null ? NaN : Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : ALERT_THRESHOLDS[key];
}
