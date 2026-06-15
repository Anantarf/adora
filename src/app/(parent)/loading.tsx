export default function ParentLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Page header skeleton */}
      <div className="flex flex-col items-start justify-between gap-3 border-b border-border/60 pb-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-muted/60" />
          <div className="h-4 w-80 animate-pulse rounded bg-muted/40" />
        </div>
        <div className="h-10 w-52 animate-pulse rounded-full bg-muted/50" />
      </div>

      {/* Player hero card skeleton */}
      <div className="h-32 w-full animate-pulse rounded-3xl border border-border/50 bg-card" />

      {/* Stats grid skeleton */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-border/50 bg-card" />
        <div className="h-72 animate-pulse rounded-2xl border border-border/50 bg-card" />
      </div>
    </div>
  );
}
