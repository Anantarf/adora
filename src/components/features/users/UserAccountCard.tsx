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
  const isSuperAdmin = user.username === "superadmin";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group flex items-center justify-between px-5 py-3 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm hover:bg-muted/30 hover:border-primary/20 transition-all duration-300 gap-4 shadow-sm hover:shadow-md"
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="size-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
          <UserCircle2 className="size-5 text-primary/70" />
        </div>
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-foreground truncate tracking-tight">{user.name ?? user.username}</span>
            {user.name && (
              <span className="text-[10px] text-muted-foreground/60 font-medium truncate">@{user.username}</span>
            )}
          </div>
          
          <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-micro font-black uppercase tracking-widest leading-none shrink-0">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>

          {isParent && (
            <button
              type="button"
              onClick={() => onViewPlayers(user.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shrink-0 text-micro font-bold uppercase tracking-wider ${
                user._count.player > 0
                  ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 shadow-sm"
                  : "border-border/40 bg-background text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Users className="size-3.5" /> 
              <span>{user._count.player} Pemain Terhubung</span>
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={() => onReset(user.id)}
            variant="ghost"
            size="sm"
            className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
          >
            <KeyRound className="size-3.5" /> 
            <span className="hidden sm:inline">Reset Sandi</span>
          </Button>
          <Button 
            onClick={() => onDelete(user.id)} 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl text-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all border border-transparent hover:border-destructive/20 shrink-0"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}

      {isSuperAdmin && (
        <div className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-widest border border-border/50">
          System Root
        </div>
      )}
    </motion.div>
  );
}
