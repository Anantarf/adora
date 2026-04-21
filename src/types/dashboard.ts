/**
 * ADORA Basketball - Central Types Registry
 * Clean types for better maintenance and fewer "any" smells.
 */

export type UserRole = "ADMIN" | "PARENT";

// ─── Evaluation Period ────────────────────────────────
export interface EvaluationPeriod {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  createdAt: Date | string;
}

// ─── Metrics (nested, per gambar raport) ─────────────
export type DribbleMetrics = {
  inAndOut: number;
  crossover: number;
  vLeft: number;
  vRight: number;
  betweenLegsLeft: number;
  betweenLegsRight: number;
};

export type PassingMetrics = {
  chestPass: number;
  bouncePass: number;
  overheadPass: number;
};

export type MetricsJson = {
  dribble: DribbleMetrics;
  passing: PassingMetrics;
  layUp: number;
  shooting: number;
  notes?: string;
};

// ─── Statistic History ────────────────────────────────
export interface StatisticHistory {
  id: string;
  statisticId: string;
  metricsJson: MetricsJson;
  status: string;
  editedAt: Date | string;
  editedBy: string | null;
  user?: { name: string | null; username: string | null } | null;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  date: Date | string;
  type: string;
  location: string | null;
  homebaseId: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  groups?: Array<{
    id: string;
    name: string;
  }>;
}

export type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPA";

export interface Attendance {
  id: string;
  date: Date | string;
  status: AttendanceStatus;
  note: string | null;
  playerId: string;
  eventId: string | null;
  createdAt: Date | string;
  player?: Player;
  event?: ScheduleEvent;
}

export interface AttendanceStats {
  HADIR: number;
  IZIN: number;
  SAKIT: number;
  ALPA: number;
}

export interface Player {
  id: string;
  name: string;
  placeOfBirth?: string | null;
  gender?: string | null;
  weight?: string | null;
  height?: string | null;
  schoolOrigin: string | null;
  address?: string | null;
  email?: string | null;
  phoneNumber: string | null;
  medicalHistory?: string | null;
  parentName?: string | null;
  parentAddress?: string | null;
  parentPhoneNumber?: string | null;
  dateOfBirth: Date | string;
  groupId: string | null;
  parentId: string | null;
  createdAt?: string | Date;
  group?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    username: string | null;
  } | null;
}

export interface UserSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: UserRole;
    username: string;
  };
}
