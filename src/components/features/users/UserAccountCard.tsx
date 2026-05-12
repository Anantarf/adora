"use client";

import { motion } from "framer-motion";
import { Users, KeyRound, Trash2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { getUsersAction } from "@/actions/users";

const ROLE_LABELS: Record<string, string> = {
  PARENT: "Orang Tua",
  ADMIN: "Admin",
};

type UserItem = Awaited<ReturnType<typeof getUsersAction>>[number];

type UserAccountCardProps = {
  user: UserItem;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  onViewPlayers: (userId: string) => void;
};

export function UserAccountCard({ user, onReset, onDelete, onViewPlayers }: UserAccountCardProps) {
  const isParent = user.role === "PARENT";
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
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-heading font-bold text-sm text-foreground truncate">{user.name ?? user.username}</span>
          {user.name && (
            <span className="text-[10px] text-muted-foreground/50 font-mono truncate hidden sm:inline">@{user.username}</span>
          )}
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-micro leading-none shrink-0">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
          {isParent && (
            <button
              type="button"
              onClick={() => onViewPlayers(user.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all shrink-0 text-micro ${
                user._count.player > 0
                  ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50"
                  : "border-border/50 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Users className="size-3" /> {user._count.player} Pemain
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      {user.username !== "superadmin" && (
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            onClick={() => onReset(user.id)}
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 rounded-lg text-micro gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <KeyRound className="size-3" /> <span className="hidden sm:inline">Atur Sandi</span>
          </Button>
          <Button onClick={() => onDelete(user.id)} variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
