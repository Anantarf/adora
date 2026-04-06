/**
 * ADORA Basketball - Central Types Registry
 * Clean types for better maintenance and fewer "any" smells.
 */

export type UserRole = "ADMIN" | "PARENT";

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  date: Date | string; // Normalized to Jakarta Time (WIB)
  type: string; // e.g., 'Latihan', 'Sparing'
  location: string | null;
  groupId: string | null;
  group?: {
    name: string;
  } | null;
}

export type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPA";

export interface Player {
  id: string;
  name: string;
  schoolOrigin: string | null;
  dateOfBirth: Date | string;
  groupId: string | null;
  parentId: string | null;
  group?: {
    id: string;
    name: string;
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
