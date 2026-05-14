import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const TEMPLATE_FONT = "Poppins";
const BRAND_PRIMARY_DARK = "FFD84315";
const BRAND_PRIMARY_SOFT = "FFFFF3E0";
const BRAND_ORANGE = "FFF4B183";
const BRAND_ORANGE_SOFT = "FFFFF4E8";
const BRAND_WHITE = "FFFFFFFF";
const BRAND_TEXT_DARK = "FF1F2937";
const BRAND_BORDER = "FFD6D3D1";
const BRAND_BORDER_SOFT = "FFE7E5E4";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    let whereClause = {};
    if (filter === "daily") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause = {
        createdAt: {
          gte: today,
        },
      };
    } else if (filter === "monthly") {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      whereClause = {
        createdAt: {
          gte: firstDayOfMonth,
        },
      };
    }

    const registrations = await prisma.registration.findMany({
      where: whereClause,
      include: {
        homebase: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

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
    let subtitleText = "Semua Riwayat Pendaftar";
    if (filter === "daily") subtitleText = "Pendaftar Hari Ini (" + format(new Date(), "dd MMMM yyyy", { locale: idLocale }) + ")";
    if (filter === "monthly") subtitleText = "Pendaftar Bulan Ini (" + format(new Date(), "MMMM yyyy", { locale: idLocale }) + ")";

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

    registrations.forEach((reg, idx) => {
      dataSheet.addRow({
        no: idx + 1,
        date: format(new Date(reg.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale }),
        name: reg.playerName,
        phone: reg.phone,
        email: reg.email || "-",
        ageGroup: reg.ageGroup,
        homebase: reg.homebase.name,
        status: reg.status,
      });
    });

    for (let i = 5; i < 5 + registrations.length; i++) {
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

    const buffer = await workbook.xlsx.writeBuffer();

    let filename = "Data_Pendaftar_Adora";
    if (filter === "daily") filename += "_Harian";
    if (filter === "monthly") filename += "_Bulanan";
    filename += `_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export registrations error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
