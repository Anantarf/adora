import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/30 backdrop-blur-[2px] transition-all animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
        <p className="font-heading text-xs font-black tracking-[0.3em] text-foreground uppercase opacity-80">
          ADORA <span className="text-brand-orange">BC</span>
        </p>
      </div>
    </div>
  );
}
