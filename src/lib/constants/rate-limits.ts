/**
 * Centralized rate-limit configuration.
 *
 * Each entry groups the namespace (used as a `RateLimitBucket.namespace`
 * discriminator) with its per-window cap and window length. Routes should
 * import these constants instead of inlining numbers, so policy changes
 * happen in one place and the operational dashboard can enumerate them.
 */
export const RATE_LIMIT_NAMESPACES = {
  UPLOAD_API: "upload-api",
  WEB_VITALS: "web-vitals",
  LOGIN_FAILURES: "login-failures",
  OPERATIONAL_ALERTS: "operational-alerts",
  SUBMIT_REGISTRATION: "submit-registration",
} as const;

export type RateLimitNamespace =
  (typeof RATE_LIMIT_NAMESPACES)[keyof typeof RATE_LIMIT_NAMESPACES];

export const RATE_LIMIT_WINDOWS = {
  ONE_MINUTE_MS: 60_000,
  FIFTEEN_MINUTES_MS: 15 * 60 * 1000,
} as const;

export const RATE_LIMIT_POLICIES = {
  upload: {
    namespace: RATE_LIMIT_NAMESPACES.UPLOAD_API,
    limit: 30,
    windowMs: RATE_LIMIT_WINDOWS.ONE_MINUTE_MS,
  },
  webVitals: {
    namespace: RATE_LIMIT_NAMESPACES.WEB_VITALS,
    limit: 120,
    windowMs: RATE_LIMIT_WINDOWS.ONE_MINUTE_MS,
  },
  loginFailures: {
    namespace: RATE_LIMIT_NAMESPACES.LOGIN_FAILURES,
    maxFailures: 10,
    windowMs: RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES_MS,
  },
  operationalAlerts: {
    namespace: RATE_LIMIT_NAMESPACES.OPERATIONAL_ALERTS,
    limit: 1,
    // Cooldown is supplied per-dispatch by the alert config; this is a
    // fallback when the config is unavailable.
    windowMs: 5 * 60 * 1000,
  },
  submitRegistration: {
    namespace: RATE_LIMIT_NAMESPACES.SUBMIT_REGISTRATION,
    limit: 5,
    windowMs: RATE_LIMIT_WINDOWS.ONE_MINUTE_MS,
  },
} as const;
