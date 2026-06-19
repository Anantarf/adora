import Link from "next/link";
import { ArrowRight, Clock, UserPlus } from "lucide-react";
import { formatFullDate } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminStatePanel } from "@/components/features/admin-state-panel";

type RegistrationProps = {
  registrations: {
    id: string;
    playerName: string;
    ageGroup: string;
    createdAt: Date;
    status: string;
  }[];
  isLoading?: boolean;
  isError?: boolean;
};

export function RecentRegistrations({ registrations, isLoading, isError }: RegistrationProps) {
  if (isError) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm min-h-[350px]">
        <div className="flex items-center gap-2 border-b border-border/50 px-5 py-4">
          <UserPlus className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Pendaftar Baru</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <AdminStatePanel
            icon={UserPlus}
            title="Gagal memuat pendaftar"
            description="Tidak dapat mengambil data. Silakan muat ulang halaman."
            tone="danger"
            className="min-h-44 w-full border-dashed"
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm min-h-[350px]">
        <div className="flex items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-48" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 px-5 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-4 py-3">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Pendaftar Baru</h2>
          </div>
          <p className="text-sm text-muted-foreground">Calon anggota yang masih menunggu proses admin.</p>
        </div>
        {registrations.length > 0 ? (
          <span className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
            {registrations.length}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-72 flex-1 flex-col px-5 py-4">
        {registrations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-background/30 px-4 py-10 text-center">
            <UserPlus className="mb-3 size-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Tidak ada pendaftar baru</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Semua pendaftar sudah diproses.</p>
          </div>
        ) : (
          <div className="custom-scrollbar flex max-h-80 flex-col gap-2.5 overflow-y-auto pr-1">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="flex flex-col gap-3 rounded-lg border border-border/50 bg-background/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {registration.playerName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md border border-border/50 bg-background px-2 py-1 font-medium">
                      {registration.ageGroup}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatFullDate(registration.createdAt)}
                    </span>
                  </div>
                </div>

                <Link
                  href="/dashboard/registrations"
                  className="inline-flex items-center gap-1 self-start rounded-md border border-border/50 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:self-center"
                >
                  Proses
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {registrations.length > 0 ? (
        <div className="border-t border-border/50 px-5 py-4">
          <Link
            href="/dashboard/registrations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            Lihat semua pendaftar
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
