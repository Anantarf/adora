"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Download, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";

import { RegistrationActions } from "@/components/features/dashboard/RegistrationActions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { sanitizePhone, toUserErrorMessage } from "@/lib/utils";
import {
  REGISTRATION_STATUS_META,
  type RegistrationStatus,
} from "@/lib/registration-status";

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

  const totalPages = Math.ceil(registrations.length / ITEMS_PER_PAGE);
  const clampedPage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedRegistrations = useMemo(
    () =>
      registrations.slice(
        (clampedPage - 1) * ITEMS_PER_PAGE,
        clampedPage * ITEMS_PER_PAGE,
      ),
    [registrations, clampedPage],
  );

  const handleExport = async (filter: string) => {
    try {
      const response = await fetch(`/api/export/registrations?filter=${filter}`);
      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorBody?.error || "Gagal mengekspor data pendaftar.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch?.[1] || `Data_Pendaftar_Adora_${filter}.xlsx`;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(toUserErrorMessage(error, "Gagal mengekspor data pendaftar."));
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="border-b border-border/50 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">Antrean Pendaftaran</h3>
            <p className="text-xs text-muted-foreground">
              Konfirmasi pembayaran lalu lanjutkan data pemain ke menu berikutnya.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {registrations.length > 0 ? (
              <span className="rounded-full border border-border/50 bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {registrations.length} menunggu
              </span>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                <Download className="size-3" />
                Export
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => handleExport("all")} className="cursor-pointer text-xs font-medium">
                  Semua Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("monthly")} className="cursor-pointer text-xs font-medium">
                  Bulan Ini
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("daily")} className="cursor-pointer text-xs font-medium">
                  Hari Ini
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-0 sm:px-5">
        {registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground/75">
            <Users className="size-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Belum ada pendaftar baru</p>
            <p className="text-xs text-muted-foreground/75">
              Pendaftar dari formulir web akan muncul di sini.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 pt-4 md:hidden">
              {paginatedRegistrations.map((registration, index) => {
                const sanitizedPhone = sanitizePhone(registration.phone);
                const statusMeta = REGISTRATION_STATUS_META[registration.status];
                const waContactUrl = `https://wa.me/${sanitizedPhone}?text=Halo%20Bapak/Ibu,%20ini%20admin%20ADORA%20BBC.%20Terkait%20pendaftaran%20ananda%20${encodeURIComponent(registration.playerName)}%20di%20${encodeURIComponent(registration.homebase.name)},%20apakah%20sudah%20melakukan%20pembayaran?`;

                return (
                  <div
                    key={registration.id}
                    className="space-y-3 rounded-lg border border-border/50 bg-background/40 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {registration.playerName}
                          </span>
                          <span className="shrink-0 rounded border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {registration.ageGroup}
                          </span>
                        </div>
                        {registration.email ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {registration.email}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                        #{(clampedPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <span className={`rounded border px-2 py-0.5 font-medium ${statusMeta.badgeClassName}`}>
                        {statusMeta.label}
                      </span>
                      <span className="rounded border border-border/50 bg-background px-2 py-0.5 text-muted-foreground">
                        {registration.homebase.name}
                      </span>
                      <span className="px-1 py-0.5 text-muted-foreground">
                        {format(new Date(registration.createdAt), "dd MMM yyyy", { locale: idLocale })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-2.5">
                      <a
                        href={`https://wa.me/${sanitizedPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-xs font-medium text-green-500 transition-colors hover:text-green-400"
                      >
                        {registration.phone}
                      </a>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <a
                          href={waContactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-green-700"
                        >
                          <MessageCircle className="size-3.5" />
                          Hubungi
                        </a>
                        <RegistrationActions regId={registration.id} status={registration.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/40">
                    <th scope="col" className="w-8 py-3 pl-1 pr-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      No
                    </th>
                    <th scope="col" className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Tanggal
                    </th>
                    <th scope="col" className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Nama Pemain
                    </th>
                    <th scope="col" className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      WhatsApp
                    </th>
                    <th scope="col" className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Lokasi
                    </th>
                    <th scope="col" className="py-3 pl-3 pr-1 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {paginatedRegistrations.map((registration, index) => {
                    const sanitizedPhone = sanitizePhone(registration.phone);
                    const statusMeta = REGISTRATION_STATUS_META[registration.status];
                    const waContactUrl = `https://wa.me/${sanitizedPhone}?text=Halo%20Bapak/Ibu,%20ini%20admin%20ADORA%20BBC.%20Terkait%20pendaftaran%20ananda%20${encodeURIComponent(registration.playerName)}%20di%20${encodeURIComponent(registration.homebase.name)},%20apakah%20sudah%20melakukan%20pembayaran?`;

                    return (
                      <tr key={registration.id} className="group transition-colors hover:bg-muted/10">
                        <td className="py-3 pl-1 pr-3 text-center text-xs font-medium text-muted-foreground">
                          {(clampedPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <div className="flex flex-col">
                            <span className="text-xs text-foreground">
                              {format(new Date(registration.createdAt), "dd MMM yyyy", { locale: idLocale })}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(registration.createdAt), "HH:mm", { locale: idLocale })}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground leading-tight">
                                {registration.playerName}
                              </span>
                              <span className="shrink-0 rounded border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {registration.ageGroup}
                              </span>
                            </div>
                            {registration.email ? (
                              <span className="text-[11px] text-muted-foreground">
                                {registration.email}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <a
                            href={`https://wa.me/${sanitizedPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-green-500 transition-colors hover:text-green-400"
                          >
                            {registration.phone}
                          </a>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClassName}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {registration.homebase.name}
                        </td>
                        <td className="py-3 pl-3 pr-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={waContactUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-green-700"
                            >
                              <MessageCircle className="size-3.5" />
                              Hubungi
                            </a>
                            <RegistrationActions regId={registration.id} status={registration.status} />
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

        {totalPages > 1 ? (
          <div className="mt-4">
            <Pagination
              currentPage={clampedPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
