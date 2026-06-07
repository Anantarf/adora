"use client";

import { AttendanceCardView } from "@/components/features/AttendanceCardView";

export default function CoachAttendancesPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-20">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-5 md:flex-row md:items-end md:pb-6">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Portal Coach
          </p>
          <h1 className="font-heading text-2xl tracking-[0.08em] text-foreground md:text-[2rem]">
            Presensi Latihan
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Kelola kehadiran pemain per agenda latihan yang ditugaskan kepada Anda.
          </p>
        </div>
      </div>

      <AttendanceCardView />
    </div>
  );
}
