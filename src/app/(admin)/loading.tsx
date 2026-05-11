export default function DashboardLoading() {
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-muted/60"></div>
          <div className="h-4 w-48 animate-pulse rounded-lg bg-muted/40"></div>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-muted/60"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="h-4 w-24 animate-pulse rounded bg-muted/60"></div>
              <div className="h-8 w-16 animate-pulse rounded bg-muted/80"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-muted/60"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border/40 pb-4 last:border-0 last:pb-0">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted/40"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted/60"></div>
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted/40"></div>
                </div>
                <div className="h-8 w-20 animate-pulse rounded bg-muted/60"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
