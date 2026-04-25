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
  ATTENDANCES: (dateStr: string, groupId?: string) => ["attendances", dateStr, groupId],
  AUDIT_LOGS_BASE: ["audit-logs"],
  AUDIT_LOGS: (cursor?: string) => ["audit-logs", cursor],
  CERTIFICATES: ["certificates"],
  PLAYER_STATS_BASE: ["player-stats"],
  PLAYER_STATS: (playerId: string) => ["player-stats", playerId],
  EVENTS_WITH_ATTENDANCE: ["events-attendance"],
  STATISTICS_BY_PERIOD_BASE: ["statistics-period"],
  STATISTICS_BY_PERIOD: (periodId: string | null) => ["statistics-period", periodId],
  STATISTIC_HISTORY: (statisticId: string | null) => ["statistic-history", statisticId],
  FAMILY_PLAYERS: ["family-players"],
  PARENTS: ["parents"],
  LINKED_PLAYERS: (parentId: string) => ["linked-players", parentId],
} as const;

// ─── Cache & Pagination ───────────────────────────────
export const HOMEBASE_CACHE_TTL = 5 * 60; // 5 minutes in seconds
export const DEFAULT_AUDIT_PAGE_SIZE = 50;

// ─── Date/Time ────────────────────────────────────────
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ─── Dashboard Metrics ─────────────────────────────────
export const ATTENDANCE_LOOKBACK_DAYS = 30;
export const TREND_STATS_SAMPLE_SIZE = 200;
