"use client";

import { useMemo, useState } from "react";
import { FileBadge, Loader2, Trash2, ExternalLink, Users, User, Search } from "lucide-react";
import { useCertificates, useDeleteCertificate } from "@/hooks/use-certificates";
import { AddCertificateDialog } from "@/components/features/AddCertificateDialog";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useCertificates();
  const deleteCert = useDeleteCertificate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCertificates = useMemo(() => {
    if (!certificates) return [];
    if (!searchQuery.trim()) return certificates;
    const q = searchQuery.toLowerCase();
    return certificates.filter((cert) => cert.title.toLowerCase().includes(q) || cert.player?.name.toLowerCase().includes(q) || cert.group?.name.toLowerCase().includes(q));
  }, [certificates, searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCert.mutateAsync(id);
      toast.success("Sertifikat berhasil dihapus.");
    } catch {
      toast.error("Gagal menghapus sertifikat. Coba lagi.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">Manajemen Sertifikat</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Unggah, kelola, dan tetapkan sertifikat prestasi digital kepada pemain atau kelompok.</p>
        </div>
        <AddCertificateDialog />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
        <input
          type="text"
          placeholder="Cari Judul, Nama Pemain, atau Kelompok..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/50 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm font-medium transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm overflow-x-auto">
        <Table className="min-w-150">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-10 text-center text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">No</TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Judul Sertifikat</TableHead>
              <TableHead className="w-44 text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Ditujukan Kepada</TableHead>
              <TableHead className="w-36 text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Tanggal Unggah</TableHead>
              <TableHead className="w-28 text-right text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <Loader2 className="size-4 animate-spin" /> Memuat data...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filteredCertificates.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 py-8">
                    <FileBadge className="size-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{searchQuery ? "Hasil tidak ditemukan" : "Belum ada sertifikat"}</p>
                    <p className="text-xs text-muted-foreground/60">{searchQuery ? "Coba gunakan kata kunci pencarian yang berbeda." : "Unggah sertifikat baru untuk memulai manajemen."}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filteredCertificates.map((cert, idx) => (
              <TableRow key={cert.id} className="even:bg-muted/10 hover:bg-muted/30 transition-colors">
                <TableCell className="text-center font-medium text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileBadge className="size-4 text-primary shrink-0" />
                    <span className="font-semibold text-secondary">{cert.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {cert.player ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary border border-secondary/20">
                      <User className="size-3" />
                      {cert.player.name}
                    </span>
                  ) : cert.group ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary border border-primary/20">
                      <Users className="size-3" />
                      {cert.group.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Umum</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(cert.uploadedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center h-8 px-2 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors text-sm">
                      <ExternalLink className="size-3.5 mr-1" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Lihat</span>
                    </a>

                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="size-3.5" />
                          </Button>
                        }
                      />
                      <AlertDialogContent className="sm:max-w-md bg-card border-border/50">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-heading uppercase tracking-widest flex items-center gap-2 text-destructive">Hapus Sertifikat?</AlertDialogTitle>
                          <AlertDialogDescription className="flex flex-col gap-2">
                            <span className="text-destructive font-semibold">Sertifikat &quot;{cert.title}&quot; akan dihapus permanen.</span>
                            <span className="text-muted-foreground text-sm">Pemain atau kelompok yang menerima sertifikat ini tidak akan bisa mengaksesnya lagi.</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(cert.id)} className="bg-destructive text-white hover:bg-destructive/90">
                            Hapus Sertifikat
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
