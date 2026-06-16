"use client";

import { AdminPageHeader } from "@/components/features/admin-page-header";
import { AttendanceCardView } from "@/components/features/AttendanceCardView";

export default function AttendancesPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <AdminPageHeader
        eyebrow="Presensi"
        title="Kehadiran Pemain"
        description="Kelola kehadiran pemain per agenda latihan."
      />

      <AttendanceCardView />
    </div>
  );
}
