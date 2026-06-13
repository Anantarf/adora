"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarRail, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, CheckSquare, FileBadge, LineChart, ShieldAlert, Layers, CalendarDays, LogOut, UserPlus, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserProfileMenu } from "./UserProfileMenu";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export const adminNavItems = [
  { title: "Dashboard Utama", url: "/dashboard", icon: LayoutDashboard },
  { title: "Agenda Klub", url: "/schedule", icon: CalendarDays },
  { title: "Data Pemain", url: "/players", icon: Layers },
  { title: "Data Presensi", url: "/attendances", icon: CheckSquare },
  { title: "Penilaian & Rapor", url: "/statistics", icon: LineChart },
  { title: "Manajemen Sertifikat", url: "/certificates", icon: FileBadge },
  { title: "Manajemen Akun", url: "/users", icon: Users },
  { title: "Pendaftar Baru", url: "/registrations", icon: UserPlus },
  { title: "Pengaturan", url: "/settings", icon: Settings },
  { title: "Audit Log", url: "/audit", icon: ShieldAlert },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (url: string) => {
    const full = `/dashboard${url === "/dashboard" ? "" : url}`;
    return url === "/dashboard" ? pathname === full : pathname.startsWith(full);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="z-40 bg-background">
      <SidebarHeader className={cn("transition-all duration-300", isCollapsed ? "px-2 py-4" : "p-4")}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className={cn("hover:bg-transparent cursor-default flex", isCollapsed ? "justify-center" : "justify-start")}>
              <div className={cn("flex aspect-square items-center justify-center transition-all duration-300", isCollapsed ? "size-8" : "size-10")}>
                <Image src="/logo-new.svg" alt="Adora BBC" width={isCollapsed ? 32 : 40} height={isCollapsed ? 32 : 40} className="w-auto h-auto object-contain" />
              </div>
              <div className={cn("flex flex-col justify-center overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0 pointer-events-none ml-0" : "w-auto opacity-100 ml-1")}>
                <span className="font-heading mt-0.5 whitespace-nowrap text-lg leading-none tracking-wide text-foreground">
                  ADORA <span className="text-primary">BBC</span>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:mb-0">Menu Navigasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 mt-2">
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                    className="h-10 px-3 gap-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-base data-active:bg-primary data-active:text-primary-foreground data-active:shadow-md"
                    render={<Link href={`/dashboard${item.url === "/dashboard" ? "" : item.url}`} />}
                  >
                    <item.icon className="size-4.5 shrink-0" />
                    <span className={cn(
                      "flex-1 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300",
                      isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                    )}>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("border-t border-border/50 flex flex-col gap-1 transition-all duration-300", isCollapsed ? "px-2 py-3" : "p-3")}>
        <UserProfileMenu variant="sidebar" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/" })}
              className="h-10 gap-3 rounded-xl px-3 font-medium text-muted-foreground transition-all duration-base hover:bg-destructive/10 hover:text-destructive"
              tooltip="Keluar"
            >
              <LogOut className="size-4.5 shrink-0" />
              <span className={cn(
                "flex-1 overflow-hidden whitespace-nowrap text-sm transition-all duration-300",
                isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
              )}>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
