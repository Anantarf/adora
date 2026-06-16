"use client";

import { motion } from "framer-motion";
import { Eye, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UserItem = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  role: "PARENT" | "ADMIN" | "COACH";
  image: string | null;
  _count: {
    player: number;
  };
};

const ROLE_LABELS: Record<string, string> = {
  PARENT: "Orang Tua",
  ADMIN: "Admin",
  COACH: "Coach",
};

type UserAccountCardProps = {
  user: UserItem;
  onViewDetail: (id: string) => void;
};

export function UserAccountCard({ user, onViewDetail }: UserAccountCardProps) {
  const displayName = user.name ?? user.username ?? "-";
  const secondaryLabel =
    user.role === "PARENT"
      ? `${user._count.player} pemain tertaut`
      : user.email || "Email belum diisi";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex items-center justify-between px-4 py-2.5 rounded-xl border border-border/50 bg-card hover:bg-muted/20 transition-colors gap-3"
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="size-8 rounded-full bg-muted border border-border/60 flex items-center justify-center shrink-0">
          <UserCircle2 className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-heading font-bold text-sm text-foreground truncate">{displayName}</span>
            <span className="shrink-0 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 min-w-0 flex-wrap text-[10px] text-muted-foreground/70">
            <span className="font-mono truncate">@{user.username}</span>
            <span className="hidden text-muted-foreground/40 sm:inline">•</span>
            <span className="truncate">{secondaryLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
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
    </motion.div>
  );
}
