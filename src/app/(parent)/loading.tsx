import { Skeleton } from "@/components/ui/skeleton";

export default function ParentLoading() {
  return (
    <div className="flex w-full flex-col gap-4 md:gap-5">
      <Skeleton className="h-24 w-full rounded-xl bg-muted/20" />
      <Skeleton className="h-32 w-full rounded-xl bg-muted/15" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl bg-muted/20" />
        ))}
      </div>
    </div>
  );
}
