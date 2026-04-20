"use client";

import { motion } from "framer-motion";
import { AtSign, Users, KeyRound, Mail, Trash2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { getUsersAction } from "@/actions/users";

type UserItem = Awaited<ReturnType<typeof getUsersAction>>[number];

type UserAccountCardProps = {
  user: UserItem;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
};

export function UserAccountCard({ user, onReset, onDelete }: UserAccountCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors gap-4"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1 w-full">
        <div className="size-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <UserCircle2 className="size-6 text-primary" />
        </div>
        <div className="min-w-0 space-y-1 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading font-bold text-base text-foreground truncate">@{user.username}</h3>
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-black uppercase tracking-widest leading-none">
              {user.role}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold tracking-wide truncate">
            {user.name && (
              <span className="flex items-center gap-1 shrink-0">
                <UserCircle2 className="size-3" /> <span className="truncate max-w-[120px] sm:max-w-none">{user.name}</span>
              </span>
            )}
            {user.email && (
              <span className="flex items-center gap-1 shrink-0 opacity-80">
                • <Mail className="size-3" /> <span className="truncate max-w-[120px] sm:max-w-none">{user.email}</span>
              </span>
            )}
            <span className="flex items-center gap-1 shrink-0 opacity-80">
              • <Users className="size-3" /> <strong className="text-secondary/70">{user._count.player} pemain</strong>
            </span>
          </div>
        </div>
      </div>

      {user.username !== "superadmin" && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
          <Button
            onClick={() => onReset(user.id)}
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-[10px] uppercase font-bold tracking-widest gap-1.5 bg-transparent border-border/50 hover:bg-muted transition-all"
          >
            <KeyRound className="size-3" /> Reset Sandi
          </Button>
          <Button onClick={() => onDelete(user.id)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
