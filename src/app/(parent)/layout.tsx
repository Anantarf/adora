import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
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
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Parent
            </p>
            <h1 className="truncate text-sm font-semibold text-foreground md:text-base">
              Portal Orang Tua
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ProfileDialog />
            <SignOutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-4 sm:px-6 md:px-8 md:pt-6 md:pb-10 lg:px-10 lg:pt-6 lg:pb-12">
          <div className="w-full animate-in fade-in duration-200 ease-out fill-mode-both">
            {children}
          </div>
        </main>
      </div>
    </ForcePasswordGate>
  );
}
