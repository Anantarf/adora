import { UserCircle } from "lucide-react";
import { SignOutButton } from "@/components/features/auth/SignOutButton";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Layout Khusus Portal Orang Tua (Parent Portal)
 * Didesain selaras dengan estetika Admin Portal yang profesional.
 */
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "PARENT" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  return (
    <div className="flex relative w-full flex-col min-h-dvh bg-background selection:bg-primary/20">
      {/* Navigation Bar - Matches Admin Header Style */}
      <header className="flex h-15 w-full shrink-0 items-center justify-between border-b border-border/60 px-4 md:px-6 sticky top-0 bg-background/80 backdrop-blur-md z-30 transition-all relative">
        <div className="flex items-center gap-2 z-10">
           {/* Adora Family Brand */}
           <div className="flex flex-col">
            <h1 className="font-heading text-lg md:text-xl lg:text-2xl text-gradient uppercase italic leading-tight font-black">
              Adora <span className="tracking-widest ml-0.5">Family</span>
            </h1>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider -mt-0.5 ml-0.5">Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 z-10">
          <Link
            href="/parent/profile"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all px-3 py-2 rounded-md hover:bg-secondary/10"
          >
            <UserCircle className="size-5" />
            <span className="hidden sm:inline">Profil</span>
          </Link>

          <SignOutButton />
        </div>
      </header>

      {/* Dynamic Content Area - Matches Admin Spacing & Animation */}
      <main className="w-full flex-1 mx-auto max-w-4xl px-4 py-4 sm:px-6 md:px-8 md:pt-6 md:pb-10 lg:px-10 lg:pt-6 lg:pb-12">
        <div className="w-full animate-in fade-in zoom-in-[0.98] duration-200 ease-out fill-mode-both">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-border/60 bg-background/50">
        <p className="text-xs font-medium text-muted-foreground">
          &copy; 2026 Adora Basketball Club. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
