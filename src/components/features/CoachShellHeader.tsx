"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { coachNavItems } from "@/components/features/CoachSidebar";
import { usePathname } from "next/navigation";

function getPageTitle(pathname: string) {
  const exactMatch = coachNavItems.find((item) => pathname === `/coach${item.url}`);
  if (exactMatch) {
    return exactMatch.title;
  }

  const partialMatch = coachNavItems.find((item) => pathname.startsWith(`/coach${item.url}`));
  return partialMatch?.title ?? "Portal Coach";
}

export function CoachShellHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center border-b border-border/60 bg-background/90 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="h-9 w-9 rounded-md transition-all hover:bg-primary/10 hover:text-primary" />
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/70">
            Coach
          </p>
          <h1 className="truncate font-heading text-base tracking-[0.08em] text-foreground md:text-lg">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
