"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Terjadi Fatal Error di Root Aplikasi:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background text-center absolute inset-0 z-50">
      <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20 shadow-sm">
        <AlertTriangle className="size-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-heading font-black uppercase tracking-widest text-foreground mb-4">
        Aplikasi Mengalami Error
      </h1>
      <p className="text-muted-foreground text-sm max-w-md leading-relaxed font-medium mb-8">
        Maaf, terjadi kesalahan saat merender tampilan aplikasi. Error:{" "}
        <span className="text-destructive font-mono bg-destructive/5 px-2 py-1 rounded">
          {error.message || "Unknown error"}
        </span>
      </p>
      <Button onClick={() => reset()} className="gap-2 font-bold uppercase tracking-widest">
        <RotateCcw className="size-4" /> Coba Lagi
      </Button>
    </div>
  );
}
