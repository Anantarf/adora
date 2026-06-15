import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLoaderProps {
  className?: string;
  fullScreen?: boolean;
  minHeight?: string;
}

export function BrandLoader({ className, fullScreen = false, minHeight }: BrandLoaderProps) {
  const containerClass = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-background/30 backdrop-blur-[2px] transition-all animate-in fade-in duration-500"
    : cn("flex w-full items-center justify-center animate-in fade-in duration-500", minHeight || "min-h-[200px]");

  const innerIconClass = fullScreen 
    ? "h-8 w-8 animate-spin text-brand-orange" 
    : "size-7 animate-spin text-primary";

  const boxClass = fullScreen 
    ? "flex flex-col items-center gap-3"
    : "flex flex-col items-center gap-4";

  const wrapperClass = fullScreen
    ? ""
    : "flex size-14 items-center justify-center rounded-2xl bg-primary/10 shadow-inner";

  const textSpanClass = fullScreen 
    ? "text-brand-orange" 
    : "text-primary";

  return (
    <div className={containerClass}>
      <div className={boxClass}>
        {fullScreen ? (
          <Loader2 className={innerIconClass} />
        ) : (
          <div className={wrapperClass}>
            <Loader2 className={innerIconClass} />
          </div>
        )}
        <p className={cn("font-heading text-xs font-black tracking-[0.3em] text-foreground uppercase opacity-80", className)}>
          ADORA <span className={textSpanClass}>BBC</span>
        </p>
      </div>
    </div>
  );
}
