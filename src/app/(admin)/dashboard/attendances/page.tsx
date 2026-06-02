"use client";

import { AttendanceCardView } from "@/components/features/AttendanceCardView";

export default function AttendancesPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-20">
      <div className="border-b border-border/50 pb-6 md:pb-8">
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          Kelola kehadiran pemain per agenda latihan.
        </p>
      </div>

      <AttendanceCardView />
    </div>
  );
}
