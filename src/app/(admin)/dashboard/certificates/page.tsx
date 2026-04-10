"use client";

import { FileBadge, Loader2, Trash2, ExternalLink, Users, User } from "lucide-react";
import { useCertificates, useDeleteCertificate } from "@/hooks/use-certificates";
import { AddCertificateDialog } from "@/components/features/AddCertificateDialog";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useCertificates();
  const deleteCert = useDeleteCertificate();

  const handleDelete = async (id: string) => {
    try {
      await deleteCert.mutateAsync(id);
      toast.success("Sertifikat berhasil dihapus.");
    } catch {
      toast.error("Gagal menghapus sertifikat.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">
            Manajemen Sertifikat
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            Upload, kelola, dan assign sertifikat prestasi digital kepada pemain atau kelas.
          </p>
        </div>
        <AddCertificateDialog />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-[60px] text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">
                No
              </TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">
                Judul Sertifikat
              </TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">
                Ditujukan Kepada
              </TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground">
                Tanggal Upload
              </TableHead>
              <TableHead className="text-[10px] uppercase font-semibold tracking-widest text-muted-foreground text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-primary font-bold">
                    <Loader2 className="size-5 animate-spin" /> Mengambil Data Sertifikat...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (!certificates || certificates.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileBadge className="size-8 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-semibold">
                      Belum ada sertifikat. Klik &quot;Tambah Sertifikat&quot; untuk memulai.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {certificates?.map((cert, idx) => (
              <TableRow key={cert.id} className="group hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileBadge className="size-4 text-primary flex-shrink-0" />
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
                    {/* Preview Link */}
                    <a
                      href={cert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center h-8 px-2 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors text-sm"
                    >
                      <ExternalLink className="size-3.5 mr-1" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Lihat</span>
                    </a>

                    {/* Delete Button with Confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-heading uppercase tracking-wider text-secondary">
                            Hapus Sertifikat?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Sertifikat &quot;{cert.title}&quot; akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cert.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Ya, Hapus
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
