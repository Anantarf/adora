"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Users, Info, MessageCircle, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RegistrationActions } from "@/components/features/dashboard/RegistrationActions";
import { Pagination } from "@/components/ui/pagination";
import { sanitizePhone } from "@/lib/utils";

// Minimal type definition based on usage
type RegistrationStatus = "PENDING" | "REVIEWED" | "COMPLETED";

type Registration = {
  id: string;
  createdAt: string | Date;
  playerName: string;
  email: string | null;
  phone: string;
  ageGroup: string;
  status: RegistrationStatus;
  homebase: {
    name: string;
  };
};

interface RegistrationsTableProps {
  registrations: Registration[];
}

export function RegistrationsTable({ registrations }: RegistrationsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [registrations]);

  const totalPages = Math.ceil(registrations.length / ITEMS_PER_PAGE);
  const paginatedRegistrations = useMemo(() => {
    return registrations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [registrations, currentPage]);

  const handleExport = (filter: string) => {
    window.open(`/api/export/registrations?filter=${filter}`, "_blank");
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="font-heading text-sm sm:text-lg tracking-widest uppercase text-foreground">Antrean Pendaftaran</h3>
            {registrations.length > 0 && (
              <span className="bg-primary/20 text-primary text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                {registrations.length} Menunggu
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer">
              <Download className="size-3.5" />
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleExport("all")} className="cursor-pointer text-xs font-bold uppercase">
                Semua Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("monthly")} className="cursor-pointer text-xs font-bold uppercase">
                Bulan Ini
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("daily")} className="cursor-pointer text-xs font-bold uppercase">
                Hari Ini
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-3 bg-secondary/5 border border-secondary/10 p-4 rounded-xl mb-6">
          <Info className="size-5 text-secondary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ini adalah daftar calon anggota yang mengisi formulir pendaftaran di web. Hubungi mereka via WhatsApp untuk mengonfirmasi pembayaran, lalu input data pemain secara manual di menu{" "}
            <strong className="text-foreground font-semibold">Kelompok Latihan</strong>. Tandai status pembayaran menggunakan tombol <strong className="text-amber-500 font-semibold">Belum Bayar</strong> atau{" "}
            <strong className="text-emerald-500 font-semibold">Sudah Bayar</strong>.
          </p>
        </div>

        {/* ── Empty State ── */}
        {registrations.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground/75">
            <Users className="size-10" />
            <p className="text-sm font-medium uppercase tracking-widest">Belum Ada Pendaftar Baru</p>
            <p className="text-xs text-muted-foreground/40">Pendaftar dari formulir web akan muncul di sini.</p>
          </div>
        )}

        {registrations.length > 0 && (
          <>
            {/* ── Mobile Card View (< md) ── */}
            <div className="md:hidden flex flex-col gap-3">
              {paginatedRegistrations.map((reg, idx) => {
                const sanitized = sanitizePhone(reg.phone);
                const waContactUrl = `https://wa.me/${sanitized}?text=Halo%20Bapak/Ibu,%20ini%20admin%20ADORA%20BBC.%20Terkait%20pendaftaran%20ananda%20${encodeURIComponent(reg.playerName)}%20di%20${encodeURIComponent(reg.homebase.name)},%20apakah%20sudah%20melakukan%20pembayaran?`;

                return (
                  <div key={reg.id} className="rounded-xl border border-border/50 bg-background/40 p-4 flex flex-col gap-3">
                    {/* Name + No */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate">{reg.playerName}</span>
                        {reg.email && <span className="text-xs text-muted-foreground truncate">{reg.email}</span>}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground/50 shrink-0">#{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold">{reg.ageGroup}</span>
                      <span className="text-xs text-muted-foreground border border-border/50 px-2 py-0.5 rounded">{reg.homebase.name}</span>
                      <span className="text-xs text-muted-foreground/75">{format(new Date(reg.createdAt), "dd MMM yyyy", { locale: idLocale })}</span>
                    </div>

                    {/* Phone + Actions */}
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40">
                      <a href={`https://wa.me/${sanitized}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 font-mono text-xs transition-colors truncate">
                        {reg.phone}
                      </a>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={waContactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
                        >
                          <MessageCircle className="size-3" />
                          Hubungi
                        </a>
                        <RegistrationActions regId={reg.id} status={reg.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop Table View (md+) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-muted-foreground uppercase bg-muted/50 font-bold tracking-widest">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg w-10 text-center">No</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Nama Pemain</th>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3">Kelompok Usia</th>
                    <th className="px-4 py-3">Lokasi Latihan</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginatedRegistrations.map((reg, idx) => {
                    const sanitized = sanitizePhone(reg.phone);
                    const waContactUrl = `https://wa.me/${sanitized}?text=Halo%20Bapak/Ibu,%20ini%20admin%20ADORA%20BBC.%20Terkait%20pendaftaran%20ananda%20${encodeURIComponent(reg.playerName)}%20di%20${encodeURIComponent(reg.homebase.name)},%20apakah%20sudah%20melakukan%20pembayaran?`;

                    return (
                      <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{format(new Date(reg.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          <div className="flex flex-col gap-0.5">
                            <span>{reg.playerName}</span>
                            {reg.email && <span className="text-xs text-muted-foreground font-normal">{reg.email}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <a href={`https://wa.me/${sanitized}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 font-mono transition-colors">
                            {reg.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold">{reg.ageGroup}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{reg.homebase.name}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={waContactUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl transition-all hover:scale-105 shadow-sm whitespace-nowrap"
                            >
                              <MessageCircle className="size-3.5" />
                              Hubungi (WA)
                            </a>
                            <RegistrationActions regId={reg.id} status={reg.status} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
