export const QUERY_KEYS = {
  SCHEDULE_EVENTS: ["schedule-events"],
  PUBLIC_EVENTS: ["public-events"],
  PLAYERS_BASE: ["players"],
  PLAYERS: (groupId?: string) => ["players", groupId || "all"],
  DASHBOARD_METRICS: ["dashboard-metrics"],
  GROUPS: ["groups"],
  HOMEBASES: ["homebases"],
  USERS_BASE: ["users"],
  USERS: (role?: string) => ["users", role],
  EVALUATION_PERIODS_BASE: ["evaluation-periods"],
  EVALUATION_PERIODS_ACTIVE: ["evaluation-periods", "active"],
  ATTENDANCES_BASE: ["attendances"],
  ATTENDANCES: (dateStr: string) => ["attendances", dateStr],
  AUDIT_LOGS: ["audit-logs"],
  CERTIFICATES: ["certificates"],
  PLAYER_STATS_BASE: ["player-stats"],
  PLAYER_STATS: (playerId: string) => ["player-stats", playerId],
} as const;

// ─── Cache & Pagination ───────────────────────────────
export const HOMEBASE_CACHE_TTL = 5 * 60; // 5 minutes in seconds
export const DEFAULT_AUDIT_PAGE_SIZE = 50;

// ─── Date/Time ────────────────────────────────────────
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ─── Dashboard Metrics ─────────────────────────────────
export const ATTENDANCE_LOOKBACK_DAYS = 30;
export const TREND_STATS_SAMPLE_SIZE = 200;
