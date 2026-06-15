"use client";

import { useMemo, useState } from "react";
import { ExternalLink, FileBadge, Search, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { AddCertificateDialog } from "@/components/features/AddCertificateDialog";
import { useCertificates, useDeleteCertificate } from "@/hooks/use-certificates";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CertificatesPage() {
  const { data: certificates, isLoading, isError, refetch } = useCertificates();
  const deleteCertificate = useDeleteCertificate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredCertificates = useMemo(() => {
    if (!certificates) {
      return [];
    }

    if (!searchQuery.trim()) {
      return certificates;
    }

    const query = searchQuery.toLowerCase();
    return certificates.filter(
      (certificate) =>
        certificate.title.toLowerCase().includes(query) ||
        certificate.player?.name.toLowerCase().includes(query),
    );
  }, [certificates, searchQuery]);

  const totalPages = Math.ceil(filteredCertificates.length / ITEMS_PER_PAGE);
  const clampedPage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedCertificates = useMemo(
    () =>
      filteredCertificates.slice(
        (clampedPage - 1) * ITEMS_PER_PAGE,
        clampedPage * ITEMS_PER_PAGE,
      ),
    [filteredCertificates, clampedPage],
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteCertificate.mutateAsync(id);
      toast.success("Sertifikat berhasil dihapus.");
    } catch {
      toast.error("Gagal menghapus sertifikat. Coba lagi.");
    }
  };

  const DeleteConfirm = ({ certificate }: { certificate: { id: string; title: string } }) => (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-[11px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-1 size-3.5" />
            Hapus
          </Button>
        }
      />
      <AlertDialogContent className="border-border/50 bg-card sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-destructive">
            Hapus sertifikat?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Sertifikat &quot;{certificate.title}&quot; akan dihapus permanen dan tidak dapat
            dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleDelete(certificate.id)}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Hapus Sertifikat
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-6 md:flex-row md:items-center md:pb-8">
        <p className="text-sm text-muted-foreground">
          Kelola daftar sertifikat digital yang terhubung ke pemain.
        </p>
        <AddCertificateDialog />
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Gagal memuat daftar sertifikat. Coba muat ulang.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-destructive/40 px-3 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10"
          >
            Muat Ulang
          </button>
        </div>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari judul sertifikat atau nama pemain..."
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setCurrentPage(1);
          }}
          className="h-11 w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {isLoading ? (
        <div className="w-full py-16 border border-border/50 bg-card rounded-2xl flex items-center justify-center min-h-[300px]">
          <BrandLoader minHeight="min-h-[200px]" />
        </div>
      ) : null}

      {!isLoading && !isError && filteredCertificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/50 py-16 text-center">
          <FileBadge className="size-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            {searchQuery ? "Sertifikat tidak ditemukan" : "Belum ada sertifikat"}
          </p>
          <p className="text-xs text-muted-foreground/75">
            {searchQuery
              ? "Coba gunakan kata kunci pencarian yang berbeda."
              : "Tambahkan sertifikat baru dari tombol di atas."}
          </p>
        </div>
      ) : null}

      {!isLoading && !isError && filteredCertificates.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {paginatedCertificates.map((certificate, index) => (
              <div
                key={certificate.id}
                className="space-y-3 rounded-xl border border-border/50 bg-card px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <FileBadge className="size-4 shrink-0 text-primary" />
                      <p className="truncate text-sm font-semibold text-foreground">
                        {certificate.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-background px-2 py-1">
                        <User className="size-3" />
                        {certificate.player?.name ?? "-"}
                      </span>
                      <span>
                        {new Date(certificate.uploadedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60">
                    #{(clampedPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2 border-t border-border/40 pt-2">
                  <a
                    href={certificate.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border/50 text-[11px] font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    <ExternalLink className="size-3.5" />
                    Lihat File
                  </a>
                  <DeleteConfirm certificate={certificate} />
                </div>
              </div>
            ))}
          </div>


          <div className="hidden overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm md:block custom-scrollbar">
            <Table className="min-w-[48rem]">
              <TableHeader className="bg-muted/20">
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="w-10 text-center text-[10px] font-medium text-muted-foreground">
                    No
                  </TableHead>
                  <TableHead className="text-[10px] font-medium text-muted-foreground">
                    Judul Sertifikat
                  </TableHead>
                  <TableHead className="w-52 text-[10px] font-medium text-muted-foreground">
                    Pemain
                  </TableHead>
                  <TableHead className="w-36 text-[10px] font-medium text-muted-foreground">
                    Tanggal Unggah
                  </TableHead>
                  <TableHead className="w-32 text-right text-[10px] font-medium text-muted-foreground">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCertificates.map((certificate, index) => (
                  <TableRow
                    key={certificate.id}
                    className="transition-colors even:bg-muted/10 hover:bg-muted/20"
                  >
                    <TableCell className="text-center text-xs font-medium text-muted-foreground">
                      {(clampedPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell className="min-w-[18rem]">
                      <div className="flex items-center gap-2">
                        <FileBadge className="size-4 shrink-0 text-primary" />
                        <span className="truncate font-semibold text-foreground">{certificate.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-background px-2 py-1 text-xs text-foreground">
                        <User className="size-3" />
                        {certificate.player?.name ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(certificate.uploadedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="w-36 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={certificate.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-border/50 px-2 text-[11px] font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                        >
                          <ExternalLink className="size-3.5" />
                          Lihat
                        </a>
                        <DeleteConfirm certificate={certificate} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}

      {!isLoading && !isError && totalPages > 1 ? (
        <Pagination
          currentPage={clampedPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      ) : null}
    </div>
  );
}
