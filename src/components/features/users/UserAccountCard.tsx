"use client";

import { motion } from "framer-motion";
import { Users, KeyRound, Trash2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { getUsersAction } from "@/actions/users";

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
        <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <UserCircle2 className="size-4 text-primary" />
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-heading font-bold text-sm text-foreground truncate">{user.username}</span>
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-black uppercase tracking-widest leading-none shrink-0">
            {user.role}
          </span>
          {isParent && (
            user._count.player > 0 ? (
              <button
                type="button"
                onClick={() => onViewPlayers(user.id)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold opacity-70 hover:opacity-100 hover:text-primary transition-colors shrink-0"
              >
                <Users className="size-3" /> {user._count.player} pemain
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 font-medium shrink-0">
                <Users className="size-3" /> {user._count.player} pemain
              </span>
            )
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
            className="h-7 px-2.5 rounded-lg text-[9px] uppercase font-bold tracking-widest gap-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <KeyRound className="size-3" /> Reset
          </Button>
          <Button onClick={() => onDelete(user.id)} variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
