"use client";

import { useMemo, useState } from "react";
import { FileBadge, Loader2, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddCertificateDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const { data: players } = usePlayers("all");
  const addCertificate = useAddCertificate();

  const selectedPlayer = useMemo(
    () => players?.find((player) => player.id === selectedId) ?? null,
    [players, selectedId],
  );

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
          <DialogTitle className="flex items-center gap-2 font-heading text-xl uppercase tracking-wider">
            <FileBadge className="size-5 text-primary" />
            Unggah Sertifikat
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tambah sertifikat prestasi untuk pemain.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-micro text-muted-foreground">Judul Sertifikat</label>
            <Input
              placeholder="Contoh: Juara 1 Turnamen Kemerdekaan 2026"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-micro text-muted-foreground">URL File Sertifikat</label>
            <Input
              placeholder="/api/storage/uploads/sertifikat-001.pdf"
              value={fileUrl}
              onChange={(event) => setFileUrl(event.target.value)}
              className="h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground/70">
              Gunakan URL internal dari upload privat, misalnya{" "}
              <span className="font-mono">/api/storage/uploads/sertifikat.pdf</span>.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-micro text-muted-foreground">Pilih Pemain</label>
            <Select value={selectedId} onValueChange={(value: string | null) => setSelectedId(value || "")}>
              <SelectTrigger className="h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30">
                <SelectValue placeholder="Pilih pemain">
                  {selectedPlayer
                    ? `${selectedPlayer.name}${selectedPlayer.group ? ` - ${selectedPlayer.group.name}` : ""}`
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {players?.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                    {player.group ? ` - ${player.group.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={addCertificate.isPending || !selectedId}
            className="mt-2 h-11 text-xs font-bold uppercase tracking-widest"
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
