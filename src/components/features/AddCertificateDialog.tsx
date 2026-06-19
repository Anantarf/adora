"use client";

import { useMemo, useState } from "react";
import { Check, FileBadge, Loader2, Plus, Search, User } from "lucide-react";
import { toast } from "sonner";

import { useAddCertificate } from "@/hooks/use-certificates";
import { usePlayers } from "@/hooks/use-players";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddCertificateDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [playerQuery, setPlayerQuery] = useState("");

  const { data: players } = usePlayers("all");
  const addCertificate = useAddCertificate();

  const selectedPlayer = useMemo(
    () => players?.find((player) => player.id === selectedId) ?? null,
    [players, selectedId],
  );

  const filteredPlayers = useMemo(() => {
    if (!players) {
      return [];
    }

    const query = playerQuery.trim().toLowerCase();
    if (!query) {
      return players;
    }

    return players.filter((player) => {
      const groupName = player.group?.name?.toLowerCase() ?? "";
      return player.name.toLowerCase().includes(query) || groupName.includes(query);
    });
  }, [playerQuery, players]);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Judul sertifikat wajib diisi.");
    if (!fileUrl.trim()) return toast.error("URL file wajib diisi.");
    if (!selectedId) return toast.error("Pilih pemain terlebih dulu.");

    try {
      await addCertificate.mutateAsync({
        title: title.trim(),
        fileUrl: fileUrl.trim(),
        playerId: selectedId,
      });

      toast.success("Sertifikat berhasil ditambahkan.");
      setTitle("");
      setFileUrl("");
      setSelectedId("");
      setPlayerQuery("");
      setOpen(false);
    } catch {
      toast.error("Gagal menambahkan sertifikat.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="xl" className="w-full sm:w-auto">
            <Plus className="size-4" /> Tambah Sertifikat
          </Button>
        }
      />

      <DialogContent className="border-border/50 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileBadge className="size-5 text-primary" />
            Unggah Sertifikat
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Tambah sertifikat prestasi untuk pemain.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Judul Sertifikat</Label>
            <Input
              placeholder="Contoh: Juara 1 Turnamen Kemerdekaan 2026"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">URL File Sertifikat</Label>
            <Input
              placeholder="/api/storage/uploads/sertifikat-001.pdf"
              value={fileUrl}
              onChange={(event) => setFileUrl(event.target.value)}
              className="h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground/75">
              Gunakan URL internal dari upload privat, misalnya{" "}
              <span className="font-mono">/api/storage/uploads/sertifikat.pdf</span>.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Pilih Pemain</Label>
            <div className="space-y-2 rounded-xl border border-border/50 bg-background/40 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama pemain atau kelompok..."
                  value={playerQuery}
                  onChange={(event) => setPlayerQuery(event.target.value)}
                  className="h-10 border-border/50 bg-background/50 pl-9 focus-visible:ring-primary/30"
                />
              </div>

              {selectedPlayer ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{selectedPlayer.name}</p>
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {selectedPlayer.group?.name ?? "Belum ada kelompok"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-medium text-muted-foreground"
                    onClick={() => setSelectedId("")}
                  >
                    Ganti
                  </Button>
                </div>
              ) : null}

              <div className="max-h-56 overflow-y-auto rounded-lg border border-border/40 bg-card">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => {
                    const isSelected = player.id === selectedId;

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedId(player.id)}
                        className={`flex w-full items-center justify-between gap-3 border-b border-border/30 px-3 py-2 text-left transition-colors last:border-b-0 ${
                          isSelected ? "bg-primary/8" : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <User className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
                            <p className="truncate text-xs font-medium text-muted-foreground">
                              {player.group?.name ?? "Belum ada kelompok"}
                            </p>
                          </div>
                        </div>
                        {isSelected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-6 text-center text-xs font-medium text-muted-foreground">
                    Pemain tidak ditemukan.
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={addCertificate.isPending || !selectedId}
            className="mt-2 h-11 text-xs font-semibold"
          >
            {addCertificate.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileBadge className="mr-2 size-4" />
            )}
            {addCertificate.isPending ? "Menyimpan..." : "Simpan Sertifikat"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
