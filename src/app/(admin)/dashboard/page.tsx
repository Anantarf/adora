"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

// ─── Dashboard Utama ────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [liveDate] = useState(() =>
    new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date()),
  );

  // Clean helper for user display name
  const getUserDisplayName = () => {
    const role = session?.user?.role;
    const username = session?.user?.username;
    return role === "ADMIN" ? "SUPERADMIN" : username || "ADMIN";
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-6">
      {/* Main Content Layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Sidebar Section (Right) - Greeting */}
        <div className="w-full flex flex-col gap-4 min-w-0 overflow-hidden">
          {/* Welcome Greeting */}
          <div className="mb-4">
            <h3 className="text-muted-foreground text-[10px] uppercase font-medium tracking-[0.2em] leading-none mb-1">Selamat Datang,</h3>
            <p className="font-heading text-3xl tracking-wider text-foreground uppercase truncate">{getUserDisplayName()} 👋</p>
            {liveDate && <p className="text-sm font-semibold text-muted-foreground mt-1.5 tracking-tight">{liveDate}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
