"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Users, MessageCircle, Download } from "lucide-react";
import { toast } from "sonner";

import { RegistrationActions } from "@/components/features/dashboard/RegistrationActions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { sanitizePhone, toUserErrorMessage } from "@/lib/utils";

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

const STATUS_META: Record<
  RegistrationStatus,
  {
    badgeClassName: string;
    label: string;
    nextStep: string;
  }
> = {
  PENDING: {
    badgeClassName: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    label: "Belum Bayar",
    nextStep: "Hubungi via WhatsApp untuk konfirmasi pembayaran.",
  },
  REVIEWED: {
    badgeClassName: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    label: "Sudah Bayar",
    nextStep: "Lanjut input pemain ke menu Kelompok Latihan.",
  },
  COMPLETED: {
    badgeClassName: "border-sky-500/30 bg-sky-500/10 text-sky-500",
    label: "Selesai",
    nextStep: "Pendaftaran sudah selesai diproses.",
  },
};

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
      const fileName =
        fileNameMatch?.[1] || `Data_Pendaftar_Adora_${filter}.xlsx`;
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
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
      <div className="p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="font-heading text-sm uppercase tracking-widest text-foreground sm:text-lg">
              Antrean Pendaftaran
            </h3>
            {registrations.length > 0 ? (
              <span className="shrink-0 whitespace-nowrap rounded-full bg-primary/20 px-2 py-1 text-[10px] font-bold text-primary sm:text-xs">
                {registrations.length} menunggu
              </span>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/20">
              <Download className="size-3.5" />
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handleExport("all")}
                className="cursor-pointer text-xs font-bold uppercase"
              >
                Semua Data
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("monthly")}
                className="cursor-pointer text-xs font-bold uppercase"
              >
                Bulan Ini
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("daily")}
                className="cursor-pointer text-xs font-bold uppercase"
              >
                Hari Ini
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground/75">
            <Users className="size-10" />
            <p className="text-sm font-medium uppercase tracking-widest">
              Belum Ada Pendaftar Baru
            </p>
            <p className="text-xs text-muted-foreground/40">
              Pendaftar dari formulir web akan muncul di sini.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:hidden">
              {paginatedRegistrations.map((registration, index) => {
                const sanitizedPhone = sanitizePhone(registration.phone);
                const statusMeta = STATUS_META[registration.status];
                const waContactUrl = `https://wa.me/${sanitizedPhone}?text=Halo%20Bapak/Ibu,%20ini%20admin%20ADORA%20BBC.%20Terkait%20pendaftaran%20ananda%20${encodeURIComponent(registration.playerName)}%20di%20${encodeURIComponent(registration.homebase.name)},%20apakah%20sudah%20melakukan%20pembayaran?`;

                return (
                  <div
                    key={registration.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/40 p-4"
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
                      <span className="shrink-0 font-mono text-[10px] font-bold tabular-nums text-muted-foreground/50">
                        #{(clampedPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${statusMeta.badgeClassName}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {registration.ageGroup}
                      </span>
                      <span className="rounded-full border border-border/50 px-2 py-0.5 text-xs text-muted-foreground">
                        {registration.homebase.name}
                      </span>
                      <span className="text-xs text-muted-foreground/75">
                        {format(new Date(registration.createdAt), "dd MMM yyyy", {
                          locale: idLocale,
                        })}
                      </span>
                    </div>

                    <div className="rounded-lg border border-border/40 bg-background/50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Tindak lanjut
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                        {statusMeta.nextStep}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-1">
                      <a
                        href={`https://wa.me/${sanitizedPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-mono text-xs text-green-500 transition-colors hover:text-green-400"
                      >
                        {registration.phone}
                      </a>
                      <div className="flex shrink-0 items-center gap-2">
                        <a
                          href={waContactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-green-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-green-700"
                        >
                          <MessageCircle className="size-3" />
                          Hubungi
                        </a>
                        <RegistrationActions
                          regId={registration.id}
                          status={registration.status}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                    const statusMeta = STATUS_META[registration.status];
                    const waContactUrl = `https://wa.me/${sanitizedPhone}?text=Halo%20Bapak/Ibu,%20ini%20admin%20ADORA%20BBC.%20Terkait%20pendaftaran%20ananda%20${encodeURIComponent(registration.playerName)}%20di%20${encodeURIComponent(registration.homebase.name)},%20apakah%20sudah%20melakukan%20pembayaran?`;

                    return (
                      <tr
                        key={registration.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 text-center font-mono text-xs font-medium tabular-nums text-muted-foreground">
                          {(clampedPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
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
                            <span className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                              {registration.ageGroup}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <a
                            href={`https://wa.me/${sanitizedPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-green-500 transition-colors hover:text-green-400"
                          >
                            {registration.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${statusMeta.badgeClassName}`}
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
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-green-600 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-green-700"
                            >
                              <MessageCircle className="size-3.5" />
                              Hubungi (WA)
                            </a>
                            <RegistrationActions
                              regId={registration.id}
                              status={registration.status}
                            />
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
