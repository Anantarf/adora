"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 shadow-sm">
        <AlertTriangle className="size-10 text-destructive" />
      </div>
      <h1 className="mb-4 text-3xl font-heading font-black uppercase tracking-widest text-foreground">
        Terjadi Kesalahan Sistem
      </h1>
      <p className="mb-8 max-w-md text-sm font-medium leading-relaxed text-muted-foreground">
        Maaf, terjadi masalah saat memuat halaman ini. Coba muat ulang. Jika masalah
        berlanjut, hubungi admin.
      </p>
      <Button onClick={() => reset()} className="gap-2 font-bold uppercase tracking-widest">
        <RotateCcw className="size-4" /> Muat Ulang Halaman
      </Button>
    </div>
  );
}
