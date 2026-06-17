import { UserCircle2, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

export type UserItem = {
  id: string;
  name: string | null;
  username: string | null;
  role: "PARENT" | "ADMIN" | "COACH";
  email: string | null;
  _count: { player: number };
};

import { ROLE_LABELS } from "@/lib/utils/audit-log";

type UserAccountCardProps = {
  user: UserItem;
  onViewDetail: (userId: string) => void;
};

export function UserAccountCard({ user, onViewDetail }: UserAccountCardProps) {
  const displayName = user.name ?? user.username ?? "-";
  const secondaryLabel =
    user.role === "PARENT"
      ? `${user._count.player} pemain tertaut`
      : user.email || "Email belum diisi";

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card px-4 py-2.5 transition-colors hover:bg-muted/20 animate-in fade-in slide-in-from-top-1 duration-150">
      {/* Left: Avatar + Info */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted">
          <UserCircle2 className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate font-heading text-sm font-bold text-foreground">{displayName}</span>
            <span className="shrink-0 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2 text-[10px] text-muted-foreground/70">
            <span className="truncate font-mono">@{user.username}</span>
            <span className="hidden text-muted-foreground/40 sm:inline">-</span>
            <span className="truncate">{secondaryLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          onClick={() => onViewDetail(user.id)}
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <Eye className="size-3.5" />
          <span>Lihat Detail</span>
        </Button>
      </div>
    </div>
  );
}


