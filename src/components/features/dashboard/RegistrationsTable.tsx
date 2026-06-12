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
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Antrean Pendaftaran</h3>
            <p className="text-sm text-muted-foreground">
              Konfirmasi pembayaran lalu lanjutkan data pemain ke menu berikutnya.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {registrations.length > 0 ? (
              <span className="rounded-md border border-border/50 bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                {registrations.length} menunggu
              </span>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                <Download className="size-3.5" />
                Export
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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

      <div className="p-4 sm:p-5">
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
            <div className="flex flex-col gap-3 md:hidden">
              {paginatedRegistrations.map((registration, index) => {
                const sanitizedPhone = sanitizePhone(registration.phone);
                const statusMeta = REGISTRATION_STATUS_META[registration.status];
                const waContactUrl = `https://wa.me/${sanitizedPhone}?text=Halo%20Bapak/Ibu,%20ini%20admin%20ADORA%20BBC.%20Terkait%20pendaftaran%20ananda%20${encodeURIComponent(registration.playerName)}%20di%20${encodeURIComponent(registration.homebase.name)},%20apakah%20sudah%20melakukan%20pembayaran?`;

                return (
                  <div
                    key={registration.id}
                    className="space-y-3 rounded-xl border border-border/50 bg-background/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {registration.playerName}
                        </span>
                        {registration.email ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {registration.email}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60">
                        #{(clampedPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span
                        className={`rounded-md border px-2 py-1 font-medium ${statusMeta.badgeClassName}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="rounded-md border border-border/50 bg-background px-2 py-1 font-medium text-foreground">
                        {registration.ageGroup}
                      </span>
                      <span className="rounded-md border border-border/50 bg-background px-2 py-1">
                        {registration.homebase.name}
                      </span>
                      <span>
                        {format(new Date(registration.createdAt), "dd MMM yyyy", {
                          locale: idLocale,
                        })}
                      </span>
                    </div>

                    <div className="rounded-md border border-border/40 bg-background/50 px-3 py-2">
                      <p className="text-[11px] font-medium text-muted-foreground">Tindak lanjut</p>
                      <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                        {statusMeta.nextStep}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-2">
                      <a
                        href={`https://wa.me/${sanitizedPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-xs font-medium text-green-500 transition-colors hover:text-green-400"
                      >
                        {registration.phone}
                      </a>
                      <div className="flex shrink-0 items-center gap-2">
                        <a
                          href={waContactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-green-700"
                        >
                          <MessageCircle className="size-3" />
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
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/20 text-[10px] font-medium text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-10 rounded-l-lg px-4 py-3 text-center">
                      No
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Tanggal
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Nama Pemain
                    </th>
                    <th scope="col" className="px-4 py-3">
                      WhatsApp
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Lokasi
                    </th>
                    <th scope="col" className="rounded-r-lg px-4 py-3 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginatedRegistrations.map((registration, index) => {
                    const sanitizedPhone = sanitizePhone(registration.phone);
                    const statusMeta = REGISTRATION_STATUS_META[registration.status];
                    const waContactUrl = `https://wa.me/${sanitizedPhone}?text=Halo%20Bapak/Ibu,%20ini%20admin%20ADORA%20BBC.%20Terkait%20pendaftaran%20ananda%20${encodeURIComponent(registration.playerName)}%20di%20${encodeURIComponent(registration.homebase.name)},%20apakah%20sudah%20melakukan%20pembayaran?`;

                    return (
                      <tr key={registration.id} className="transition-colors hover:bg-muted/20">
                        <td className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                          {(clampedPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {format(new Date(registration.createdAt), "dd MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          <div className="flex max-w-[260px] flex-col gap-1">
                            <span className="font-semibold">{registration.playerName}</span>
                            {registration.email ? (
                              <span className="text-xs font-normal text-muted-foreground">
                                {registration.email}
                              </span>
                            ) : null}
                            <span className="inline-flex w-fit rounded-md border border-border/50 bg-background px-2 py-1 text-[11px] font-medium text-foreground">
                              {registration.ageGroup}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <a
                            href={`https://wa.me/${sanitizedPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-green-500 transition-colors hover:text-green-400"
                          >
                            {registration.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${statusMeta.badgeClassName}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {registration.homebase.name}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={waContactUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-[11px] font-medium text-white transition-colors hover:bg-green-700"
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
