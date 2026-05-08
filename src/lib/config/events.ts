import { Cone, Swords, Trophy, CalendarDays, LucideIcon, CheckSquare } from "lucide-react";

export type EventTypeKey = "LATIHAN" | "PERTANDINGAN" | "SPARING" | "EVALUASI" | "KHUSUS";

export interface EventConfig {
  id: EventTypeKey;
  label: string;
  accent: string;
  color: string;
  icon: LucideIcon;
}

export const EVENT_TYPES: Record<string, EventConfig> = {
  LATIHAN: {
    id: "LATIHAN",
    label: "Latihan",
    accent: "TRAINING",
    color: "var(--event-latihan)",
    icon: Cone,
  },
  SPARING: {
    id: "SPARING",
    label: "Sparing",
    accent: "SCRIMMAGE",
    color: "var(--event-sparing)",
    icon: Swords,
  },
  PERTANDINGAN: {
    id: "PERTANDINGAN",
    label: "Kejuaraan",
    accent: "GAMEDAY",
    color: "var(--event-pertandingan)",
    icon: Trophy,
  },
  EVALUASI: {
    id: "EVALUASI",
    label: "Test Day!",
    accent: "EVALUATION",
    color: "var(--event-evaluasi)",
    icon: CheckSquare,
  },
  KHUSUS: {
    id: "KHUSUS",
    label: "Agenda Lainnya",
    accent: "SPECIAL",
    color: "var(--event-khusus)",
    icon: CalendarDays,
  },
};

export const DEFAULT_EVENT_TYPE: EventTypeKey = "LATIHAN";

export const getEventConfig = (type: string): EventConfig => {
  return EVENT_TYPES[type] || EVENT_TYPES.KHUSUS;
};
