"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { BarChart3, FileText, LogOut, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";

import { UserProfileMenu } from "@/components/features/UserProfileMenu";
import { cn } from "@/lib/utils";

export const parentNavItems = [
  { title: "Ringkasan Pemain", panel: "ringkasan", url: "/parent?panel=ringkasan", icon: BarChart3 },
  { title: "Rapor & Sertifikat", panel: "dokumen", url: "/parent?panel=dokumen", icon: FileText },
  { title: "Riwayat Performa", panel: "riwayat", url: "/parent?panel=riwayat", icon: UserRound },
];

export function ParentSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const activePanel = searchParams.get("panel") ?? "ringkasan";

  const isActive = (panel: string) => pathname === "/parent" && activePanel === panel;

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="z-40 bg-background">
      <SidebarHeader className={cn("transition-all duration-300", isCollapsed ? "px-2 py-4" : "p-4")}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className={cn("flex cursor-default hover:bg-transparent", isCollapsed ? "justify-center" : "justify-start")}>
              <div className={cn("flex aspect-square items-center justify-center transition-all duration-300", isCollapsed ? "size-8" : "size-10")}>
                <Image src="/logo-new.svg" alt="Adora BBC" width={isCollapsed ? 32 : 40} height={isCollapsed ? 32 : 40} className="h-auto w-auto object-contain" />
              </div>
              <div className={cn("flex flex-col justify-center overflow-hidden transition-all duration-300", isCollapsed ? "ml-0 w-0 pointer-events-none opacity-0" : "ml-1 w-auto opacity-100")}>
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
          <SidebarGroupLabel className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:mb-0">
            Portal Orang Tua
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2 gap-2">
              {parentNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive(item.panel)}
                    className="h-10 gap-3 rounded-xl px-3 transition-all duration-base hover:bg-primary/10 hover:text-primary data-active:bg-primary data-active:text-primary-foreground data-active:shadow-md"
                    render={<Link href={item.url} />}
                  >
                    <item.icon className="size-4.5 shrink-0" />
                    <span className={cn("flex-1 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300", isCollapsed ? "w-0 pointer-events-none opacity-0" : "w-auto opacity-100")}>
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("flex flex-col gap-1 border-t border-border/50 transition-all duration-300", isCollapsed ? "px-2 py-3" : "p-3")}>
        <UserProfileMenu variant="sidebar" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/" })}
              className="h-10 gap-3 rounded-xl px-3 font-medium text-muted-foreground transition-all duration-base hover:bg-destructive/10 hover:text-destructive"
              tooltip="Keluar"
            >
              <LogOut className="size-4.5 shrink-0" />
              <span className={cn("flex-1 overflow-hidden whitespace-nowrap text-sm transition-all duration-300", isCollapsed ? "w-0 pointer-events-none opacity-0" : "w-auto opacity-100")}>
                Keluar
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
