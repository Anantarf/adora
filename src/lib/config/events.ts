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
    color: "#D4AF37", // Gold
    icon: Cone,
  },
  SPARING: {
    id: "SPARING",
    label: "Sparing",
    accent: "SCRIMMAGE",
    color: "#F97316", // Orange
    icon: Swords,
  },
  PERTANDINGAN: {
    id: "PERTANDINGAN",
    label: "Kejuaraan",
    accent: "GAMEDAY",
    color: "#E11D48", // Red
    icon: Trophy,
  },
  EVALUASI: {
    id: "EVALUASI",
    label: "Test Day!",
    accent: "EVALUATION",
    color: "#3B82F6", // Blue
    icon: CheckSquare, // using calendar or check
  },
  KHUSUS: {
    id: "KHUSUS",
    label: "Agenda Lainnya",
    accent: "SPECIAL",
    color: "#8B5CF6", // Purple
    icon: CalendarDays,
  },
};

export const DEFAULT_EVENT_TYPE: EventTypeKey = "LATIHAN";

export const getEventConfig = (type: string): EventConfig => {
  return EVENT_TYPES[type] || EVENT_TYPES.KHUSUS;
};
