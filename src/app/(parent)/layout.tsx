import { UserCircle } from "lucide-react";
import { SignOutButton } from "@/components/features/auth/SignOutButton";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ForcePasswordGate } from "@/components/features/auth/ForcePasswordGate";
import { ProfileDialog } from "@/components/features/auth/ProfileDialog";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "PARENT" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  return (
    <ForcePasswordGate>
      <div className="flex relative w-full flex-col min-h-dvh bg-background selection:bg-primary/20">
        <header className="flex h-15 w-full shrink-0 items-center justify-between border-b border-border/60 px-4 md:px-6 sticky top-0 bg-background/80 backdrop-blur-md z-30 transition-all relative">
          <div className="flex items-center gap-2 z-10">
            <div className="flex flex-col">
              <h1 className="font-heading text-lg md:text-xl lg:text-2xl text-gradient uppercase leading-tight font-black">
                Adora <span className="tracking-widest ml-0.5">Family</span>
              </h1>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider -mt-0.5 ml-0.5">Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6 z-10">
            <ProfileDialog />
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
        <footer className="py-6 text-center border-t border-border/60 bg-background/50 mt-auto">
          <p className="text-xs font-medium text-muted-foreground">
            &copy; {new Date().getFullYear()} Adora Basketball Club. All rights reserved.
          </p>
        </footer>
      </div>
    </ForcePasswordGate>
  );
}
