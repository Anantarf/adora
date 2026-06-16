"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Terjadi Fatal Error di Aplikasi:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <AdminStatePanel
        icon={AlertTriangle}
        title="Terjadi kesalahan sistem"
        description="Maaf, terjadi masalah saat memuat halaman ini. Coba muat ulang. Jika masalah berlanjut, hubungi admin."
        className="min-h-80 w-full max-w-xl"
        action={
          <Button onClick={() => reset()} className="h-9 gap-2 rounded-lg text-xs font-semibold">
            <RotateCcw className="size-4" /> Muat Ulang
          </Button>
        }
      />
    </div>
  );
}
