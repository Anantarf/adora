import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Prisma } from "@prisma/client";

export const EXPORT_BATCH_SIZE = 500;
export const MAX_EXPORT_ROWS = Number(process.env.MAX_EXPORT_REGISTRATIONS_ROWS || 5000);

export const TEMPLATE_FONT = "Poppins";
export const BRAND_PRIMARY_DARK = "FFD84315";
export const BRAND_PRIMARY_SOFT = "FFFFF3E0";
export const BRAND_ORANGE = "FFF4B183";
export const BRAND_ORANGE_SOFT = "FFFFF4E8";
export const BRAND_WHITE = "FFFFFFFF";
export const BRAND_TEXT_DARK = "FF1F2937";
export const BRAND_BORDER = "FFD6D3D1";
export const BRAND_BORDER_SOFT = "FFE7E5E4";

export type RegistrationExportFilter = "all" | "daily" | "monthly";

export function buildRegistrationWhereClause(filter: string): Prisma.registrationWhereInput {
  if (filter === "daily") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      createdAt: {
        gte: today,
      },
    };
  }

  if (filter === "monthly") {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      createdAt: {
        gte: firstDayOfMonth,
      },
    };
  }

  return {};
}

export function buildRegistrationSubtitle(filter: string) {
  if (filter === "daily") {
    return `Pendaftar Hari Ini (${format(new Date(), "dd MMMM yyyy", { locale: idLocale })})`;
  }

  if (filter === "monthly") {
    return `Pendaftar Bulan Ini (${format(new Date(), "MMMM yyyy", { locale: idLocale })})`;
  }

  return "Semua Riwayat Pendaftar";
}

export function buildRegistrationExportFilename(filter: string) {
  let filename = "Data_Pendaftar_Adora";
  if (filter === "daily") filename += "_Harian";
  if (filter === "monthly") filename += "_Bulanan";
  filename += `_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  return filename;
}

export function formatRegistrationDate(value: Date) {
  return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: idLocale });
}

export { idLocale };
