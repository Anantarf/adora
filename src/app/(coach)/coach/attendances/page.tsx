"use client";

import { CalendarDays, ClipboardCheck } from "lucide-react";

import { AdminPageHeader } from "@/components/features/admin-page-header";
import { AttendanceCardView } from "@/components/features/AttendanceCardView";

export default function CoachAttendancesPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <AdminPageHeader
        eyebrow="Presensi Pelatih"
        title="Kehadiran Pemain"
        description="Kelola kehadiran pemain per agenda latihan yang ditugaskan kepada Anda."
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <CalendarDays className="size-4 text-primary" />
            Daftar Agenda
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Daftar hanya menampilkan agenda latihan yang bisa diakses oleh akun pelatih.
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <ClipboardCheck className="size-4 text-primary" />
            Catat Kehadiran
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Pilih agenda untuk membuka detail pemain, lalu simpan status kehadiran.
          </p>
        </div>
      </div>

      <AttendanceCardView />
    </div>
  );
}
