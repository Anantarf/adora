"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { getPlayersByParentAction } from "@/actions/players";
import { QUERY_KEYS } from "@/lib/constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface LinkedPlayersModalProps {
  parentId: string | null;
  parentUsername?: string;
  onOpenChange: (open: boolean) => void;
}

export function LinkedPlayersModal({ parentId, parentUsername, onOpenChange }: LinkedPlayersModalProps) {
  const { data: players, isLoading } = useQuery({
    queryKey: QUERY_KEYS.LINKED_PLAYERS(parentId ?? ""),
    queryFn: () => getPlayersByParentAction(parentId!),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Dialog open={!!parentId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="font-heading text-base uppercase tracking-widest text-foreground">
            Pemain Terhubung
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {parentUsername ? `Daftar pemain yang terhubung ke akun @${parentUsername}.` : "Daftar pemain yang terhubung ke akun ini."}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-1">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : !players || players.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-dashed border-border/50">
              <Users className="size-8 text-muted-foreground/30" />
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Belum Ada Pemain Terhubung</p>
              <p className="text-xs text-muted-foreground/60">Hubungkan pemain melalui form edit atau tambah pemain.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {players.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/50 bg-background/40">
                  <span className="text-sm font-semibold text-foreground">{p.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 py-0.5 rounded bg-muted/50">
                    {p.group?.name ?? "Tanpa Kelompok"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
