import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MetricsJson } from "@/types/dashboard";
import { getEvaluationSummary, isMetricsJsonV2, type MetricsJsonV2 } from "@/lib/evaluation-rules";

const PRINT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

const CERTIFICATE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  year: "numeric",
};

const MAX_STATISTICS = 6;
const MAX_ATTENDANCE = 30;
const MAX_CERTIFICATES = 12;

export type ReportMetricItem = {
  label: string;
  value: number;
  max: number;
};

export type SessionActor = {
  id?: string;
  role?: string;
};

export const ALLOWED_REPORT_ROLES = new Set(["ADMIN", "PARENT"]);

export type PlayerReportRecord = NonNullable<Awaited<ReturnType<typeof getPlayerReportRecord>>>;
export type ReportViewModel = {
  attendanceRateLabel: string;
  age: number;
  certificates: Array<{ title: string; uploadedAtLabel: string }>;
  coachNotes: string;
  evaluationDateLabel: string;
  generatedAtLabel: string;
  groupName: string;
  latestMetrics: ReportMetricItem[];
  overallScoreLabel: string;
  playerName: string;
  schoolOrigin: string;
  totalCertificates: number;
  totalEvaluations: number;
};

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString("id-ID", options);
}

function parseStoredMetrics(raw: unknown): MetricsJson | MetricsJsonV2 | null {
  let data = raw;

  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  if (isMetricsJsonV2(data)) {
    return data;
  }

  const candidate = data as Record<string, unknown>;
  const isLegacyMetrics =
    candidate.dribble != null &&
    typeof candidate.dribble === "object" &&
    candidate.passing != null &&
    typeof candidate.passing === "object";

  return isLegacyMetrics ? (candidate as MetricsJson) : null;
}

function extractReportMetrics(raw: MetricsJson | MetricsJsonV2 | null): { metrics: ReportMetricItem[]; notes: string } {
  if (!raw) {
    return { metrics: [], notes: "" };
  }

  if (isMetricsJsonV2(raw)) {
    const summary = getEvaluationSummary(raw);
    return {
      metrics: summary.flatRows.map((item) => ({
        label: item.label,
        value: item.value,
        max: item.max,
      })),
      notes: summary.notes,
    };
  }

  const parsed = raw as Partial<MetricsJson> & { notes?: unknown };

  return {
    metrics: [
      { label: "In & Out Dribble", value: toNumber(parsed.dribble?.inAndOut), max: 10 },
      { label: "Crossover", value: toNumber(parsed.dribble?.crossover), max: 10 },
      { label: "V Dribble (Kiri)", value: toNumber(parsed.dribble?.vLeft), max: 10 },
      { label: "V Dribble (Kanan)", value: toNumber(parsed.dribble?.vRight), max: 10 },
      { label: "Between Legs (Kiri)", value: toNumber(parsed.dribble?.betweenLegsLeft), max: 10 },
      { label: "Between Legs (Kanan)", value: toNumber(parsed.dribble?.betweenLegsRight), max: 10 },
      { label: "Chest Pass", value: toNumber(parsed.passing?.chestPass), max: 10 },
      { label: "Bounce Pass", value: toNumber(parsed.passing?.bouncePass), max: 10 },
      { label: "Overhead Pass", value: toNumber(parsed.passing?.overheadPass), max: 10 },
      { label: "Lay Up", value: toNumber(parsed.layUp), max: 10 },
      { label: "Shooting", value: toNumber(parsed.shooting), max: 10 },
    ],
    notes: typeof parsed.notes === "string" ? parsed.notes : "",
  };
}

export async function getSessionActor() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }

  return session.user as SessionActor;
}

export function getRequestedPlayerId(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  return playerId?.trim() || null;
}

export async function getPlayerReportRecord(playerId: string) {
  return prisma.player.findUnique({
    where: { id: playerId, isDeleted: false },
    select: {
      id: true,
      name: true,
      parentId: true,
      dateOfBirth: true,
      schoolOrigin: true,
      group: { select: { name: true } },
      statistic: {
        where: { status: "Published" },
        orderBy: { date: "desc" },
        take: MAX_STATISTICS,
        select: {
          date: true,
          metricsJson: true,
        },
      },
      attendance: {
        orderBy: { date: "desc" },
        take: MAX_ATTENDANCE,
        select: {
          status: true,
        },
      },
      certificate: {
        orderBy: { uploadedAt: "desc" },
        take: MAX_CERTIFICATES,
        select: {
          title: true,
          uploadedAt: true,
        },
      },
      _count: {
        select: {
          certificate: true,
          statistic: {
            where: { status: "Published" },
          },
        },
      },
    },
  });
}

export function canActorAccessPlayer(actor: SessionActor, player: PlayerReportRecord) {
  if (!actor.role || !ALLOWED_REPORT_ROLES.has(actor.role)) {
    return false;
  }

  if (actor.role === "PARENT" && player.parentId !== actor.id) {
    return false;
  }

  return true;
}

export function buildReportViewModel(player: PlayerReportRecord): ReportViewModel {
  const latestStat = player.statistic[0];
  const latestMetrics = latestStat ? parseStoredMetrics(latestStat.metricsJson) : null;
  const extractedMetrics = extractReportMetrics(latestMetrics);
  const totalAttendance = player.attendance.length;
  const hadirCount = player.attendance.filter((attendance) => attendance.status === "HADIR").length;
  const attendanceRate = totalAttendance > 0 ? ((hadirCount / totalAttendance) * 100).toFixed(0) : "N/A";
  const overallScore = latestMetrics
    ? String(getEvaluationSummary(latestMetrics).totalScore)
    : "N/A";

  return {
    attendanceRateLabel: attendanceRate === "N/A" ? attendanceRate : `${attendanceRate}%`,
    age: getAge(player.dateOfBirth),
    certificates: player.certificate.map((certificate) => ({
      title: certificate.title,
      uploadedAtLabel: formatDate(certificate.uploadedAt, CERTIFICATE_DATE_FORMAT),
    })),
    coachNotes: extractedMetrics.notes,
    evaluationDateLabel: latestStat ? formatDate(latestStat.date, PRINT_DATE_FORMAT) : "Belum ada evaluasi",
    generatedAtLabel: formatDate(new Date(), PRINT_DATE_FORMAT),
    groupName: player.group?.name || "Tanpa Kelompok",
    latestMetrics: extractedMetrics.metrics,
    overallScoreLabel: overallScore,
    playerName: player.name,
    schoolOrigin: player.schoolOrigin || "-",
    totalCertificates: player._count.certificate,
    totalEvaluations: player._count.statistic,
  };
}
