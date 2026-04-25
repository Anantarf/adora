"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Users, Info, MessageCircle } from "lucide-react";
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

  // Reset pagination when period or group changes (if needed)
  useEffect(() => {
    setCurrentPage(1);
  }, [registrations]);

  const totalPages = Math.ceil(registrations.length / ITEMS_PER_PAGE);
  const paginatedRegistrations = useMemo(() => {
    return registrations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [registrations, currentPage]);

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="font-heading text-lg tracking-widest uppercase text-foreground">
            Antrean Pendaftaran
          </h3>
          <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full">
            {registrations.length} Menunggu
          </span>
        </div>

        <div className="flex gap-3 bg-secondary/5 border border-secondary/10 p-4 rounded-xl mb-6">
          <Info className="size-5 text-secondary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ini adalah daftar calon member yang mengisi form pendaftaran di web. Hubungi mereka via WhatsApp untuk mengonfirmasi pembayaran, lalu input data pemain secara manual di menu{" "}
            <strong className="text-foreground font-semibold">Kelompok Latihan</strong>.
            Tandai status pembayaran menggunakan tombol <strong className="text-amber-500 font-semibold">Belum Bayar</strong> atau <strong className="text-emerald-500 font-semibold">Sudah Bayar</strong>.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/50 font-bold tracking-widest">
              <tr>
                <th className="px-4 py-3 rounded-l-lg w-10 text-center">No</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Nama Pemain</th>
                <th className="px-4 py-3">No. HP (WA)</th>
                <th className="px-4 py-3">Program / KU</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3 rounded-r-lg text-right min-w-[280px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/60">
                      <Users className="size-10" />
                      <p className="text-sm font-medium uppercase tracking-widest">Belum Ada Pendaftar Baru</p>
                      <p className="text-xs text-muted-foreground/40">Pendaftar dari form web akan muncul di sini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRegistrations.map((reg, idx) => {
                  const sanitized = sanitizePhone(reg.phone);
                  const waContactUrl = `https://wa.me/${sanitized}?text=Halo%20Bapak/Ibu,%20ini%20admin%20Adora%20Basketball%20Club.%20Terkait%20pendaftaran%20ananda%20${encodeURIComponent(reg.playerName)}%20di%20${encodeURIComponent(reg.homebase.name)},%20apakah%20sudah%20melakukan%20pembayaran?`;

                  return (
                    <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(reg.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground flex flex-col items-start gap-1">
                        <span>{reg.playerName}</span>
                        {reg.email && <div className="text-xs text-muted-foreground font-normal">{reg.email}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a
                          href={`https://wa.me/${sanitized}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-400 font-mono transition-colors"
                        >
                          {reg.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold">
                          {reg.ageGroup}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{reg.homebase.name}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 min-w-[280px]">
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
                })
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
