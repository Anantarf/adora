"use client";

import { useEffect, useMemo, useState } from "react";
import { FileBadge, Loader2, Trash2, ExternalLink, Users, User, Search, Filter, X } from "lucide-react";
import { useCertificates, useDeleteCertificate } from "@/hooks/use-certificates";
import { AddCertificateDialog } from "@/components/features/AddCertificateDialog";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";

// ─── TYPES & HELPERS ────────────────────────────────────

type Certificate = {
  id: string;
  title: string;
  fileUrl: string;
  uploadedAt: string | Date;
  player?: { name: string } | null;
  group?: { name: string } | null;
};

/**
 * Reusable Recipient Badge (Lean Component)
 */
function RecipientBadge({ cert }: { cert: Certificate }) {
  if (cert.player) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-secondary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-secondary border border-secondary/20 shadow-sm">
        <User className="size-3" />
        {cert.player.name}
      </span>
    );
  }
  if (cert.group) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20 shadow-sm">
        <Users className="size-3" />
        {cert.group.name}
      </span>
    );
  }
  return <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest italic">Tanpa Penerima</span>;
}

// ─── MAIN PAGE ──────────────────────────────────────────

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useCertificates();
  const deleteCert = useDeleteCertificate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PLAYER" | "GROUP">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [certificates?.length, searchQuery, typeFilter]);

  // Core Filtering Logic
  const filteredData = useMemo(() => {
    if (!certificates) return [];
    
    return certificates.filter((cert) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        cert.title.toLowerCase().includes(q) || 
        cert.player?.name.toLowerCase().includes(q) || 
        cert.group?.name.toLowerCase().includes(q);
      
      const matchesType = 
        typeFilter === "ALL" || 
        (typeFilter === "PLAYER" && !!cert.player) || 
        (typeFilter === "GROUP" && !!cert.group);
      
      return matchesSearch && matchesType;
    });
  }, [certificates, searchQuery, typeFilter]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCert.mutateAsync(id);
      toast.success("Sertifikat berhasil dihapus.");
    } catch {
      toast.error("Gagal menghapus sertifikat.");
    }
  };

  const DeleteConfirm = ({ cert }: { cert: Certificate }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all border border-transparent hover:border-destructive/20">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-heading uppercase tracking-widest text-destructive">Hapus Sertifikat?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-medium leading-relaxed">
            Sertifikat <span className="text-foreground font-black">&quot;{cert.title}&quot;</span> akan dihapus permanen. Penerima tidak akan lagi melihat file ini di portal mereka.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-3">
          <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11 flex-1">Batal</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDelete(cert.id)} className="rounded-xl bg-destructive text-white font-bold uppercase tracking-widest text-[10px] h-11 flex-1 shadow-lg shadow-destructive/20">
            Ya, Hapus Permanen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border/50 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl md:text-5xl text-foreground tracking-[0.2em] uppercase leading-none">Sertifikat</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Pemberian apresiasi digital kepada pemain dan tim ADORA BBC.</p>
        </div>
        <AddCertificateDialog />
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Cari Judul atau Penerima..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors">
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-56 h-11 rounded-xl border-border/50 bg-card/40 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all">
              <Filter className="size-3.5 mr-2" />
              {typeFilter === "ALL" ? "Semua Kategori" : typeFilter === "PLAYER" ? "Penerima Pemain" : "Penerima Kelompok"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1 shadow-2xl backdrop-blur-xl bg-card/95 border-border/40">
            <DropdownMenuItem onClick={() => setTypeFilter("ALL")} className="rounded-xl text-[10px] font-black uppercase py-3 cursor-pointer">Semua Kategori</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("PLAYER")} className="rounded-xl text-[10px] font-black uppercase py-3 cursor-pointer text-secondary">Penerima Pemain</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("GROUP")} className="rounded-xl text-[10px] font-black uppercase py-3 cursor-pointer text-emerald-400">Penerima Kelompok</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content Card */}
      <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6">
          {/* States */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs font-black tracking-widest text-muted-foreground animate-pulse uppercase">Sinkronisasi Sertifikat...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground/30">
              <div className="p-5 rounded-2xl bg-muted/20">
                <FileBadge className="size-12" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-black uppercase tracking-widest">Data Kosong</p>
                <p className="text-[10px] font-medium italic">{searchQuery ? "Hasil pencarian nihil." : "Belum ada sertifikat yang diunggah."}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                  <thead className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-4 py-2 w-12 text-center">No</th>
                      <th className="px-4 py-2">Judul Sertifikat</th>
                      <th className="px-4 py-2">Ditujukan Kepada</th>
                      <th className="px-4 py-2">Tanggal Unggah</th>
                      <th className="px-4 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((cert, idx) => (
                      <tr key={cert.id} className="group hover:bg-muted/40 transition-all rounded-2xl">
                        <td className="px-4 py-5 text-center text-xs font-bold text-muted-foreground/50 bg-muted/10 rounded-l-2xl group-hover:bg-transparent">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <FileBadge className="size-4" />
                            </div>
                            <span className="font-bold text-foreground">{cert.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <RecipientBadge cert={cert} />
                        </td>
                        <td className="px-4 py-5 text-xs font-bold text-muted-foreground/80">
                          {new Date(cert.uploadedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-5 text-right rounded-r-2xl group-hover:bg-transparent">
                          <div className="flex items-center justify-end gap-2">
                            <a 
                              href={cert.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl border border-border/60 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                            >
                              <ExternalLink className="size-3.5" />
                              Buka
                            </a>
                            <DeleteConfirm cert={cert} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="lg:hidden flex flex-col gap-4">
                {paginatedData.map((cert, idx) => (
                  <div key={cert.id} className="p-5 rounded-2xl border border-border/50 bg-background/50 flex flex-col gap-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FileBadge className="size-4" />
                        </div>
                        <span className="font-bold text-foreground text-sm tracking-tight">{cert.title}</span>
                      </div>
                      <span className="text-micro font-black text-muted-foreground/30">#{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <RecipientBadge cert={cert} />
                      <span className="text-[10px] font-bold text-muted-foreground/60 ml-auto">
                        {new Date(cert.uploadedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-border/40">
                      <a 
                        href={cert.fileUrl} 
                        target="_blank" 
                        className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-border/60 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all"
                      >
                        <ExternalLink className="size-3.5" />
                        Lihat Sertifikat
                      </a>
                      <DeleteConfirm cert={cert} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-8 border-t border-border/30 pt-6">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
