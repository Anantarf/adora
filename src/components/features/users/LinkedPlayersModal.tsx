"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Link2, X, Loader2 } from "lucide-react";
import { getPlayersByParentAction } from "@/actions/players";
import { useAvailablePlayers, useLinkPlayer, useUnlinkPlayer } from "@/hooks/use-players";
import { QUERY_KEYS } from "@/lib/constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface LinkedPlayersModalProps {
  parentId: string | null;
  parentName?: string;
  onOpenChange: (open: boolean) => void;
}

export function LinkedPlayersModal({ parentId, parentName, onOpenChange }: LinkedPlayersModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: players, isLoading } = useQuery({
    queryKey: QUERY_KEYS.LINKED_PLAYERS(parentId ?? ""),
    queryFn: () => getPlayersByParentAction(parentId!),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: availablePlayers, isLoading: isAvailableLoading } = useAvailablePlayers();
  const { mutateAsync: linkPlayer, isPending: isLinking } = useLinkPlayer();
  const { mutateAsync: unlinkPlayer, isPending: isUnlinking } = useUnlinkPlayer();

  const handleLink = async (playerId: string) => {
    if (!parentId) return;
    try {
      await linkPlayer({ playerId, parentId });
      toast.success("Pemain berhasil ditautkan ke akun!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menautkan pemain.");
    }
  };

  const handleUnlink = async (playerId: string) => {
    if (!parentId) return;
    try {
      await unlinkPlayer({ playerId, parentId });
      toast.success("Tautan pemain berhasil dilepas.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal melepas tautan pemain.");
    }
  };

  // Tutup mode pencarian kalau modal ditutup
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsAdding(false);
      setSearchTerm("");
    }
    onOpenChange(open);
  };

  const filteredAvailablePlayers = availablePlayers?.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ?? [];

  return (
    <Dialog open={!!parentId} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50 p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="px-5 pt-5 pb-4 shrink-0 border-b border-border/50">
          <DialogTitle className="font-heading text-lg uppercase tracking-wide text-foreground">{isAdding ? "Hubungkan Pemain" : "Pemain Terhubung"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1.5">
            {isAdding ? "Cari dan pilih pemain untuk ditautkan ke akun ini." : parentName ? `Daftar pemain yang terhubung ke akun ${parentName}.` : "Daftar pemain yang terhubung ke akun ini."}
          </DialogDescription>
        </DialogHeader>

        {isAdding ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-4 shrink-0 border-b border-border/50 bg-background/30">
              <input
                type="text"
                placeholder="Cari nama pemain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg bg-background border border-border/50 focus:outline-none focus:border-primary/50 transition-colors"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isAvailableLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredAvailablePlayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-dashed border-border/50">
                  <Users className="size-8 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground text-center">{searchTerm ? "Tidak Ditemukan" : "Tidak Ada Pemain"}</p>
                  <p className="text-xs text-muted-foreground/75 text-center px-4">{searchTerm ? "Coba gunakan kata kunci lain." : "Semua pemain sudah terhubung ke akun orang tua."}</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredAvailablePlayers.map((p) => (
                    <li key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/40 hover:border-primary/30 transition-colors">
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
                        <span className="text-micro text-muted-foreground/75 truncate mt-0.5">{p.group?.name ?? "Belum ada kelompok"}</span>
                      </div>
                      <Button onClick={() => handleLink(p.id)} disabled={isLinking} size="sm" className="h-8 px-3 text-micro rounded-lg shrink-0 shadow-none">
                        {isLinking ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <Link2 className="size-3 mr-1.5" />}
                        Pilih
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 shrink-0 border-t border-border/50 bg-card">
              <Button variant="ghost" className="w-full text-xs" onClick={() => setIsAdding(false)}>
                Kembali
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-4 shrink-0 border-b border-border/50 bg-background/30">
              <Button onClick={() => setIsAdding(true)} className="w-full h-10 border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary transition-all font-semibold shadow-none">
                + Hubungkan Pemain Baru
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : !players || players.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-border/50">
                  <Users className="size-8 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">Belum Ada Pemain</p>
                  <p className="text-xs text-muted-foreground/75 text-center px-4">Akun ini belum terhubung dengan data anak mana pun.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {players.map((p) => (
                    <li key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/40 hover:bg-muted/30 transition-colors group">
                      <div className="flex flex-col min-w-0 pr-3">
                        <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
                        <span className="text-micro text-muted-foreground/75 truncate mt-0.5">{p.group?.name ?? "Belum ada kelompok"}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnlink(p.id)}
                        disabled={isUnlinking}
                        className="size-8 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0"
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
