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
    // Log the error to the console automatically
    console.error("Terjadi Fatal Error di Aplikasi:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
      <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20 shadow-sm">
        <AlertTriangle className="size-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-heading font-black uppercase tracking-widest text-foreground mb-4">
        Terjadi Kesalahan Sistem
      </h1>
      <p className="text-muted-foreground text-sm max-w-md leading-relaxed font-medium mb-8">
        Maaf, terjadi masalah saat memuat halaman ini. Coba muat ulang — jika masalah berlanjut, hubungi Admin.
      </p>
      <Button onClick={() => reset()} className="gap-2 font-bold uppercase tracking-widest">
        <RotateCcw className="size-4" /> Muat Ulang Halaman
      </Button>
    </div>
  );
}
