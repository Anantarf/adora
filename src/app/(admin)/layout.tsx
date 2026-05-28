import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/features/AdminSidebar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ForcePasswordGate } from "@/components/features/auth/ForcePasswordGate";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// The layout that strictly bounds all internal admin pages (/dashboard/*)
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Server-side redirect to prevent Flash of Unauthenticated Content (FOUC)
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <ForcePasswordGate>
      <SidebarProvider className="min-h-dvh bg-background">
        <AdminSidebar />
        <SidebarInset className="relative flex min-h-dvh min-w-0 w-full flex-col bg-background selection:bg-primary/20">
          <header className="flex h-15 w-full shrink-0 items-center justify-between border-b border-border/60 px-4 md:px-6 sticky top-0 bg-background/80 backdrop-blur-md z-30 transition-all relative">
            <div className="z-10 flex items-center gap-2 md:hidden">
              <SidebarTrigger className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-all rounded-md" />
            </div>

            {/* Centered Top Nav Title */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max max-w-[60vw]">
              <h1 className="font-heading text-[10px] xs:text-sm sm:text-lg md:text-xl lg:text-2xl text-foreground uppercase leading-tight font-black text-center tracking-wide">
                Adora <span className="text-primary tracking-widest ml-0.5">Basketball Club</span>
              </h1>
            </div>

            <div className="h-9 w-9 md:hidden" />
          </header>
          <div className="mx-auto flex w-full min-w-0 flex-1 max-w-375 px-4 py-4 sm:px-6 md:px-8 md:pt-6 md:pb-10 lg:px-10 lg:pt-6 lg:pb-12">
            <div className="w-full min-w-0 animate-in fade-in duration-200 ease-out fill-mode-both">{children}</div>
          </div>

          {/* Footer for consistency */}
          <footer className="mt-auto w-full min-w-0 border-t border-border/60 bg-background/50 py-6 text-center">
            <p className="text-xs font-medium text-muted-foreground">&copy; {new Date().getFullYear()} Adora Basketball Club. All rights reserved.</p>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </ForcePasswordGate>
  );
}
