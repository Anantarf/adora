"use client";

import { AttendanceCardView } from "@/components/features/AttendanceCardView";

export default function CoachAttendancesPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-20">
      <div className="border-b border-border/50 pb-6 md:pb-8">
        <p className="text-sm text-muted-foreground">
          Kelola kehadiran pemain per agenda latihan yang ditugaskan kepada Anda.
        </p>
      </div>

      <AttendanceCardView />
    </div>
  );
}
