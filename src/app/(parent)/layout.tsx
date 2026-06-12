import { Metadata } from "next";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileDialog } from "@/components/features/auth/ProfileDialog";
import { SignOutButton } from "@/components/features/auth/SignOutButton";
import { ForcePasswordGate } from "@/components/features/auth/ForcePasswordGate";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  if (session.user.role !== "PARENT") {
    redirect("/login");
  }

  return (
    <ForcePasswordGate>
      <div className="relative flex min-h-dvh w-full flex-col bg-background selection:bg-primary/20">
        <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur md:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-muted/30"
            aria-label="ADORA Basketball Club"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/20">
              <Image
                src="/logo-new.svg"
                alt="ADORA Basketball Club"
                width={30}
                height={30}
                className="h-auto w-auto object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-black uppercase tracking-[0.24em] text-foreground">
                  ADORA
                </span>
              </div>
              <p className="truncate text-xs font-medium text-muted-foreground md:text-sm">
                Portal Orang Tua
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ProfileDialog />
            <SignOutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 md:px-8 md:pt-5 md:pb-10 lg:px-10 lg:pt-5 lg:pb-12">
          <div className="w-full animate-in fade-in duration-200 ease-out fill-mode-both">
            {children}
          </div>
        </main>
      </div>
    </ForcePasswordGate>
  );
}
