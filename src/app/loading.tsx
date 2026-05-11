export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-all animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          {/* Animated Spinner Rings */}
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg shadow-primary/20"></div>
          <div className="absolute h-10 w-10 animate-spin-reverse rounded-full border-4 border-secondary border-t-transparent shadow-md shadow-secondary/10"></div>
          
          {/* Central Pulsing Logo Placeholder/Dot */}
          <div className="h-4 w-4 animate-pulse rounded-full bg-primary shadow-sm shadow-primary"></div>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <p className="font-heading text-sm font-bold tracking-widest text-primary uppercase animate-pulse">
            Adora <span className="text-foreground">BC</span>
          </p>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
            Memuat Pengalaman...
          </p>
        </div>
      </div>
    </div>
  );
}
