"use client";

import { useState } from "react";
import { useAddCertificate } from "@/hooks/use-certificates";
import { usePlayers } from "@/hooks/use-players";
import { toast } from "sonner";
import { FileBadge, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddCertificateDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const { data: players } = usePlayers("all");
  const addCert = useAddCertificate();

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Judul sertifikat wajib diisi.");
    if (!fileUrl.trim()) return toast.error("URL file wajib diisi.");

    try {
      await addCert.mutateAsync({
        title: title.trim(),
        fileUrl: fileUrl.trim(),
        ...(selectedId ? { playerId: selectedId } : {}),
      });
      toast.success("Sertifikat berhasil ditambahkan!");
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
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl uppercase tracking-wider flex items-center gap-2">
            <FileBadge className="size-5 text-primary" /> Unggah Sertifikat
          </DialogTitle>
          <DialogDescription className="text-xs">Tambah sertifikat prestasi untuk pemain.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          {/* Certificate Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-micro text-muted-foreground">Judul Sertifikat</label>
            <Input placeholder="Contoh: Juara 1 Turnamen Kemerdekaan 2026" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30" />
          </div>

          {/* File URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-micro text-muted-foreground">URL File Sertifikat</label>
            <Input
              placeholder="https://drive.google.com/... atau /api/storage/uploads/cert-001.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground/70">Gunakan tautan publik — di Google Drive: klik kanan file → Bagikan → &quot;Siapa saja yang memiliki tautan&quot; → Salin tautan.</p>
          </div>

          {/* Player Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-micro text-muted-foreground">Pilih Pemain</label>
            <Select value={selectedId} onValueChange={(v: string | null) => setSelectedId(v || "")}>
              <SelectTrigger className="h-11 border-border/50 bg-background/50 focus-visible:ring-primary/30">
                <SelectValue placeholder="Cari nama pemain..." />
              </SelectTrigger>
              <SelectContent>
                {players?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.group ? `• ${p.group.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={addCert.isPending} className="h-11 uppercase font-bold tracking-widest text-xs mt-2">
            {addCert.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileBadge className="mr-2 size-4" />}
            {addCert.isPending ? "Menyimpan..." : "Simpan Sertifikat"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
