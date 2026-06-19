"use client";

import { useMemo, useState } from "react";
import { ExternalLink, FileBadge, Search, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { AddCertificateDialog } from "@/components/features/AddCertificateDialog";
import { AdminPageHeader } from "@/components/features/admin-page-header";
import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { useCertificates, useDeleteCertificate } from "@/hooks/use-certificates";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
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
            variant="outline"
            size="sm"
            className="h-9 rounded-lg border-destructive/30 px-3 text-xs font-medium text-destructive transition-colors hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-1.5 size-3.5" />
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
      <AdminPageHeader
        eyebrow="Dokumen Pemain"
        title="Sertifikat"
        description="Kelola daftar sertifikat digital yang terhubung ke pemain."
        actions={<AddCertificateDialog />}
      />

      {isError ? (
        <AdminStatePanel
          icon={FileBadge}
          title="Gagal memuat daftar sertifikat."
          description="Coba muat ulang halaman atau ulangi beberapa saat lagi."
          tone="danger"
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-destructive/40 px-4 py-2 text-[11px] font-medium text-destructive hover:bg-destructive/10"
            >
              Muat Ulang
            </button>
          }
        />
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
        <>
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-xl bg-muted/20" />
            ))}
          </div>
          <div className="hidden min-h-[300px] rounded-xl border border-border/50 bg-card p-4 md:block">
            <Skeleton className="h-11 w-full rounded-xl bg-muted/25" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg bg-muted/15" />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {!isLoading && !isError && filteredCertificates.length === 0 ? (
        <AdminStatePanel
          icon={FileBadge}
          title={searchQuery ? "Sertifikat tidak ditemukan" : "Belum ada sertifikat"}
          description={searchQuery ? "Coba gunakan kata kunci pencarian yang berbeda." : "Tambahkan sertifikat baru dari tombol di atas."}
        />
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
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                    #{(clampedPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2 border-t border-border/40 pt-2">
                  <a
                    href={certificate.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/50 px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
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
                  <TableHead className="w-10 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    No
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Judul Sertifikat
                  </TableHead>
                  <TableHead className="w-52 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Pemain
                  </TableHead>
                  <TableHead className="w-36 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Tanggal Unggah
                  </TableHead>
                  <TableHead className="w-32 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/50 px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
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
