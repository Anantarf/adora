"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { adminNavItems } from "@/components/features/AdminSidebar";
import { usePathname } from "next/navigation";

const pageDescriptions: Record<string, string> = {
  "/dashboard": "Ringkasan kerja hari ini",
  "/dashboard/players": "Kelola kelompok dan data pemain",
  "/dashboard/statistics": "Input dan cek progres penilaian",
  "/dashboard/registrations": "Tindak lanjuti pendaftar baru",
  "/dashboard/schedule": "Atur agenda klub dan kegiatan",
  "/dashboard/users": "Kelola akun admin dan orang tua",
  "/dashboard/settings": "Atur aset dan identitas dokumen",
  "/dashboard/attendances": "Pantau presensi pemain",
  "/dashboard/certificates": "Kelola sertifikat pemain",
  "/dashboard/audit": "Lihat perubahan penting sistem",
};

function getPageTitle(pathname: string) {
  const exactMatch = adminNavItems.find((item) => {
    const target = `/dashboard${item.url === "/dashboard" ? "" : item.url}`;
    return pathname === target;
  });

  if (exactMatch) {
    return exactMatch.title;
  }

  const partialMatch = adminNavItems.find((item) => {
    const target = `/dashboard${item.url === "/dashboard" ? "" : item.url}`;
    return item.url !== "/dashboard" && pathname.startsWith(target);
  });

  return partialMatch?.title ?? "Dashboard";
}

export function AdminShellHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const description = pageDescriptions[pathname] ?? "Area kerja admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="h-9 w-9 rounded-md transition-all hover:bg-primary/10 hover:text-primary" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Admin
          </p>
          <h1 className="truncate text-sm font-semibold text-foreground md:text-base">
            {title}
          </h1>
        </div>
      </div>
      <p className="hidden text-xs text-muted-foreground lg:block">{description}</p>
    </header>
  );
}
