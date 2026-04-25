import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import type { AttendanceStatus } from "@/types/dashboard";

// ─── Absensi ──────────────────────────────────────────────────────────────────

export const ATTENDANCE_STATUS_STYLE: Record<AttendanceStatus, { label: string; color: string; badge: string }> = {
  HADIR: { label: "HADIR", color: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  IZIN:  { label: "IZIN",  color: "text-amber-500",   badge: "bg-amber-500/10 text-amber-500 border-amber-500/20"   },
  SAKIT: { label: "SAKIT", color: "text-orange-500",  badge: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  ALPA:  { label: "ALPA",  color: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20" },
};

// ─── Periode Evaluasi ─────────────────────────────────────────────────────────

export const PERIOD_STATUS_BADGE = {
  Draft:     { label: "Draft",   className: "border-sky-500/50 text-sky-400 bg-sky-500/10" },
  Published: { label: "Selesai", className: "border-primary/50 text-primary bg-primary/10 font-heading" },
} satisfies Record<string, { label: string; className: string }>;

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditActionKey = "CREATE" | "UPDATE" | "DELETE" | "default";

export const AUDIT_ACTION_CONFIG: Record<AuditActionKey, { color: string; icon: typeof Plus; label: string }> = {
  CREATE:  { color: "#22C55E", icon: Plus,     label: "Tambah" },
  UPDATE:  { color: "#3B82F6", icon: Pencil,   label: "Ubah"   },
  DELETE:  { color: "#E11D48", icon: Trash2,   label: "Hapus"  },
  default: { color: "#8B5CF6", icon: FileText, label: "Aksi"   },
};

export function getAuditActionConfig(action: string) {
  const key = action.toUpperCase();
  if (key.includes("CREATE") || key.includes("ADD"))                           return AUDIT_ACTION_CONFIG.CREATE;
  if (key.includes("UPDATE") || key.includes("EDIT") || key.includes("SET"))  return AUDIT_ACTION_CONFIG.UPDATE;
  if (key.includes("DELETE") || key.includes("REMOVE"))                        return AUDIT_ACTION_CONFIG.DELETE;
  return AUDIT_ACTION_CONFIG.default;
}
