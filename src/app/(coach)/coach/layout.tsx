import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { CoachShellHeader } from "@/components/features/CoachShellHeader";
import { CoachSidebar } from "@/components/features/CoachSidebar";
import { ForcePasswordGate } from "@/components/features/auth/ForcePasswordGate";
import { Providers } from "@/components/providers/query-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CoachLayout({
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

  if (session.user.role === "PARENT") {
    redirect("/parent");
  }

  if (session.user.role !== "COACH") {
    redirect("/login");
  }

  return (
    <Providers>
      <ForcePasswordGate>
        <SidebarProvider defaultOpen={true} persistState={false} className="min-h-dvh bg-background">
          <CoachSidebar />
          <SidebarInset className="relative flex min-h-dvh min-w-0 w-full flex-col bg-background selection:bg-primary/20">
            <CoachShellHeader />

            <main id="main" className="mx-auto flex w-full min-w-0 max-w-375 flex-1 px-4 py-4 sm:px-6 md:px-8 md:pt-6 md:pb-10 lg:px-10 lg:pt-6 lg:pb-12">
              <div className="w-full min-w-0 animate-in fade-in duration-200 ease-out fill-mode-both">
                {children}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ForcePasswordGate>
    </Providers>
  );
}

