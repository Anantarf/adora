"use client";

import { motion } from "framer-motion";
import { AtSign, Baby, KeyRound, Mail, Trash2, UserCircle2 } from "lucide-react";
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group glass-card p-6 rounded-[2.5rem] border-white/20 transition-all hover:bg-white/60 dark:hover:bg-white/5 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-secondary/5 border-2 border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
            <UserCircle2 className="size-7 text-primary group-hover:text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-secondary leading-tight truncate max-w-35">{user.name}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <AtSign className="size-3" /> {user.username}
            </div>
          </div>
        </div>
        <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[8px] font-black uppercase tracking-widest">{user.role}</div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <Mail className="size-3.5 text-primary/40" />
          <span className="truncate">{user.email || "- Tidak ada email -"}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <Baby className="size-3.5 text-primary/40" />
          <span>
            Terhubung dengan <strong className="text-secondary">{user._count.player} data pemain</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-border/40">
        <Button
          onClick={() => onReset(user.id)}
          variant="ghost"
          size="sm"
          className="flex-1 h-9 rounded-xl text-[10px] uppercase font-black tracking-widest gap-2 hover:bg-secondary/10 hover:text-secondary group-hover:border-border/50 transition-all border border-transparent"
        >
          <KeyRound className="size-3.5" /> Atur Ulang Sandi
        </Button>
        <Button onClick={() => onDelete(user.id)} variant="ghost" size="sm" className="shrink-0 size-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}
