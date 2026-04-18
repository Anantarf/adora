"use client";

import { AttendanceCardView } from "@/components/features/AttendanceCardView";

export default function AttendancesPage() {
  return (
    <div className="flex flex-col gap-6 w-full pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Daftar Hadir Latihan</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Kelola kehadiran pemain per agenda latihan.</p>
        </div>
      </div>

      {/* Main Agenda Flow */}
      <AttendanceCardView />
    </div>
  );
}
