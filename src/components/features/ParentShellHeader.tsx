"use client";

import { usePathname } from "next/navigation";

import { parentNavItems } from "@/components/features/ParentSidebar";
import { useParentPanel } from "@/components/features/parent-panel-context";
import { SidebarTrigger } from "@/components/ui/sidebar";

function getPageTitle(pathname: string, panel: string) {
  const match = parentNavItems.find((item) => pathname === "/parent" && item.panel === panel);
  return match?.title ?? "Portal Orang Tua";
}

export function ParentShellHeader() {
  const pathname = usePathname();
  const { activePanel } = useParentPanel();
  const title = getPageTitle(pathname, activePanel);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center border-b border-border/60 bg-background/90 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="h-9 w-9 rounded-md transition-all hover:bg-primary/10 hover:text-primary" />
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/75">
            Orang Tua
          </p>
          <h1 className="truncate font-heading text-base tracking-[0.08em] text-foreground md:text-lg">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
