import { Clock, CheckCircle2, type LucideIcon } from "lucide-react";

/**
 * Single source of truth for the registration lifecycle labels, colors, and
 * follow-up copy. Both the table cell (`RegistrationsTable`) and the
 * `Select` action menu (`RegistrationActions`) read from here so the
 * operator never sees mismatched wording.
 */
export const REGISTRATION_STATUSES = ["PENDING", "REVIEWED", "COMPLETED"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export type RegistrationStatusMeta = {
  label: string;
  badgeClassName: string;
  selectClassName: string;
  nextStep: string;
  icon: LucideIcon;
};

export const REGISTRATION_STATUS_META: Record<RegistrationStatus, RegistrationStatusMeta> = {
  PENDING: {
    label: "Belum Bayar",
    badgeClassName: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    selectClassName:
      "border-amber-500/30 bg-amber-500/10 text-amber-500 focus:bg-amber-500/10 focus:text-amber-600",
    nextStep: "Hubungi via WhatsApp untuk konfirmasi pembayaran.",
    icon: Clock,
  },
  REVIEWED: {
    label: "Sudah Bayar",
    badgeClassName: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    selectClassName:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-600",
    nextStep: "Lanjut input pemain ke menu Kelompok Latihan.",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Selesai",
    badgeClassName: "border-sky-500/30 bg-sky-500/10 text-sky-500",
    selectClassName:
      "border-sky-500/30 bg-sky-500/10 text-sky-500 focus:bg-sky-500/10 focus:text-sky-600",
    nextStep: "Pendaftaran sudah selesai diproses.",
    icon: CheckCircle2,
  },
};

export function getRegistrationStatusMeta(status: RegistrationStatus): RegistrationStatusMeta {
  return REGISTRATION_STATUS_META[status];
}
