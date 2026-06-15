export default function CoachLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Page header skeleton */}
      <div className="space-y-2 border-b border-border/50 pb-6">
        <div className="h-3 w-20 animate-pulse rounded bg-muted/60" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted/40" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-11 flex-1 animate-pulse rounded-xl border border-border/50 bg-card" />
        <div className="h-11 w-48 animate-pulse rounded-xl border border-border/50 bg-card" />
      </div>

      {/* Content cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4"
          >
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted/60" />
              <div className="h-3 w-28 animate-pulse rounded bg-muted/40" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 animate-pulse rounded-xl bg-muted/40" />
              <div className="h-9 w-20 animate-pulse rounded-xl bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
