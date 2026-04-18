"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter } from "@/components/ui/sidebar";
import { Cone, LayoutDashboard, Users, CheckSquare, FileBadge, LineChart, ShieldAlert, Layers, CalendarDays, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const navItems = [
  { title: "Dashboard Utama", url: "/dashboard", icon: LayoutDashboard },
  { title: "Input Jadwal Klub", url: "/schedule", icon: CalendarDays },
  { title: "Kelompok Latihan", url: "/players", icon: Layers },
  { title: "Input Absensi", url: "/attendances", icon: CheckSquare },
  { title: "Input Penilaian", url: "/statistics", icon: LineChart },
  { title: "Sertifikat Digital", url: "/certificates", icon: FileBadge },
  { title: "Manajemen Akun", url: "/users", icon: Users },
  { title: "Audit Log (Keamanan)", url: "/audit", icon: ShieldAlert },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (url: string) => {
    const full = `/dashboard${url === "/dashboard" ? "" : url}`;
    return url === "/dashboard" ? pathname === full : pathname.startsWith(full);
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/50 bg-background">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:size-8">
                <Cone className="size-5 group-data-[collapsible=icon]:size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="font-heading text-xl tracking-wider text-foreground">ADORA</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-semibold mb-2 tracking-widest uppercase text-xs">Menu Navigasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 mt-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                    className="h-10 px-3 gap-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md"
                    render={<Link href={`/dashboard${item.url === "/dashboard" ? "" : item.url}`} />}
                  >
                    <item.icon className="size-4.5" />
                    <span className="font-semibold tracking-wide flex-1">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut({ callbackUrl: "/" })} className="h-10 px-3 gap-3 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all duration-300 font-bold">
              <LogOut className="size-4.5" />
              <span className="tracking-wide flex-1">Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
