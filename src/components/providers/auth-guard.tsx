"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Pelindung Rute (AuthGuard)
 * Memastikan sesi login MySQL (NextAuth) aktif sebelum merender halaman rahasia.
 * Juga menangani pengecekan peran (Admin/Parent).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Jika loading, tunggu.
    if (status === "loading") return;

    // 2. Jika tidak login, tendang ke halaman login root
    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }

    // 3. Cek peran (Role-based check) (Server Middleware sudah menghandle ini, tapi kita tambahkan lapis kedua di client)
    const userRole = session?.user?.role;
    
    if (pathname.startsWith("/dashboard") && userRole !== "ADMIN") {
      router.replace("/");
    } else if (pathname.startsWith("/parent") && userRole !== "PARENT" && userRole !== "ADMIN") {
      router.replace("/");
    }
  }, [status, session, router, pathname]);

  // Loading State yang modern dan minimalis
  if (status === "loading") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="size-10 animate-spin text-primary/40" />
        <p className="text-xs font-heading tracking-[0.3em] uppercase text-muted-foreground animate-pulse">
          Memverifikasi Sesi...
        </p>
      </div>
    );
  }

  // Jika tidak terotorisasi, jangan render apa pun (mencegah flash of content)
  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
