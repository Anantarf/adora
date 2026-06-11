import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import {
  BRAND_BORDER,
  BRAND_BORDER_SOFT,
  BRAND_ORANGE,
  BRAND_ORANGE_SOFT,
  BRAND_PRIMARY_DARK,
  BRAND_PRIMARY_SOFT,
  BRAND_TEXT_DARK,
  BRAND_WHITE,
  EXPORT_BATCH_SIZE,
  MAX_EXPORT_ROWS,
  TEMPLATE_FONT,
  buildRegistrationExportFilename,
  buildRegistrationSubtitle,
  buildRegistrationWhereClause,
  formatRegistrationDate,
  idLocale,
} from "@/lib/export/registrations-report";
import { recordOperationalError, recordOperationalWarning } from "@/lib/observability";
import { withTimeout } from "@/lib/async-utils";

const ALLOWED_EXPORT_FILTERS = new Set(["all", "daily", "monthly"]);
const EXPORT_BUFFER_TIMEOUT_MS = 20_000;
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    if (!ALLOWED_EXPORT_FILTERS.has(filter)) {
      return NextResponse.json({ error: "Filter export tidak valid." }, { status: 400 });
    }

    const whereClause = buildRegistrationWhereClause(filter);

    const totalRegistrations = await prisma.registration.count({ where: whereClause });
    if (totalRegistrations > MAX_EXPORT_ROWS) {
      await recordOperationalWarning({
        source: "export-registrations",
        message: "Export registrations blocked because dataset is too large",
        statusCode: 413,
        metadata: { filter, totalRegistrations, maxRows: MAX_EXPORT_ROWS },
      });
      return NextResponse.json(
        {
          error: `Jumlah data terlalu besar untuk diekspor sekaligus. Batasi filter hingga maksimal ${MAX_EXPORT_ROWS} baris.`,
        },
        { status: 413 },
      );
    }

    const { default: ExcelJS } = await import("exceljs");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Adora Basketball";
    workbook.created = new Date();

    const dataSheet = workbook.addWorksheet("Data Pendaftar", {
      properties: { defaultRowHeight: 22 },
      views: [{ state: "frozen", ySplit: 4 }],
    });

    dataSheet.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };
    dataSheet.properties.tabColor = { argb: BRAND_PRIMARY_DARK };

    dataSheet.columns = [
      { key: "no", width: 8 },
      { key: "date", width: 25 },
      { key: "name", width: 35 },
      { key: "phone", width: 25 },
      { key: "email", width: 30 },
      { key: "ageGroup", width: 20 },
      { key: "homebase", width: 30 },
      { key: "status", width: 20 },
    ];

    dataSheet.mergeCells("A1:H1");
    const titleRow = dataSheet.getRow(1);
    titleRow.height = 34;
    titleRow.getCell(1).value = "DATA PENDAFTAR - ADORA BASKETBALL CLUB";
    titleRow.getCell(1).font = { name: TEMPLATE_FONT, size: 14, bold: true, color: { argb: BRAND_WHITE } };
    titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_PRIMARY_DARK } };
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

    dataSheet.mergeCells("A2:H2");
    const subtitleRow = dataSheet.getRow(2);
    subtitleRow.height = 26;
    const subtitleText = buildRegistrationSubtitle(filter);

    subtitleRow.getCell(1).value = `Laporan Pendaftaran: ${subtitleText} | Diekstrak pada: ${format(new Date(), "dd MMM yyyy HH:mm", { locale: idLocale })}`;
    subtitleRow.getCell(1).font = { name: TEMPLATE_FONT, size: 10, color: { argb: BRAND_TEXT_DARK } };
    subtitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ORANGE_SOFT } };
    subtitleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };

    dataSheet.getRow(3).height = 10;

    const headerRow = dataSheet.getRow(4);
    headerRow.values = ["No.", "Tanggal Daftar", "Nama Pemain", "WhatsApp", "Email", "Kelompok Usia", "Lokasi Latihan", "Status"];
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: BRAND_TEXT_DARK }, name: TEMPLATE_FONT, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ORANGE } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: BRAND_BORDER } },
        left: { style: "thin", color: { argb: BRAND_BORDER } },
        bottom: { style: "medium", color: { argb: BRAND_BORDER } },
        right: { style: "thin", color: { argb: BRAND_BORDER } },
      };
    });

    let cursorId: string | undefined;
    let rowNumber = 0;

    while (true) {
      const registrations = await prisma.registration.findMany({
        where: whereClause,
        orderBy: { id: "asc" },
        take: EXPORT_BATCH_SIZE,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        select: {
          id: true,
          createdAt: true,
          playerName: true,
          phone: true,
          email: true,
          ageGroup: true,
          status: true,
          homebase: {
            select: { name: true },
          },
        },
      });

      if (registrations.length === 0) {
        break;
      }

      registrations.forEach((reg) => {
        rowNumber += 1;
        dataSheet.addRow({
          no: rowNumber,
          date: formatRegistrationDate(reg.createdAt),
          name: reg.playerName,
          phone: reg.phone,
          email: reg.email || "-",
          ageGroup: reg.ageGroup,
          homebase: reg.homebase.name,
          status: reg.status,
        });
      });

      cursorId = registrations[registrations.length - 1]?.id;
    }

    for (let i = 5; i < 5 + rowNumber; i++) {
      const row = dataSheet.getRow(i);
      row.height = 23;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: TEMPLATE_FONT, size: 11, color: { argb: BRAND_TEXT_DARK } };
        cell.alignment = { vertical: "middle", horizontal: colNumber === 1 || colNumber === 2 || colNumber === 6 || colNumber === 8 ? "center" : "left", wrapText: false };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: i % 2 === 0 ? BRAND_PRIMARY_SOFT : BRAND_WHITE },
        };
        cell.border = {
          top: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
          left: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
          bottom: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
          right: { style: "thin", color: { argb: BRAND_BORDER_SOFT } },
        };
      });
    }

    const buffer = await withTimeout(
      workbook.xlsx.writeBuffer(),
      EXPORT_BUFFER_TIMEOUT_MS,
      "EXPORT_WRITE_TIMEOUT",
    );
    const filename = buildRegistrationExportFilename(filter);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EXPORT_WRITE_TIMEOUT") {
      await recordOperationalError({
        source: "export-registrations",
        message: "Export registrations workbook generation timed out",
        error,
        statusCode: 503,
        durationMs: EXPORT_BUFFER_TIMEOUT_MS,
      });
      return NextResponse.json({ error: "Export sedang terlalu berat. Coba lagi sebentar lagi." }, { status: 503 });
    }

    await recordOperationalError({
      source: "export-registrations",
      message: "Export registrations request failed",
      error,
      statusCode: 500,
    });
    return NextResponse.json({ error: "Export data pendaftar gagal. Coba lagi sebentar lagi." }, { status: 500 });
  }
}
