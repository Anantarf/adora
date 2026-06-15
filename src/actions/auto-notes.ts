"use server";

import { z } from "zod";

import {
  buildDynamicMetricsJson,
  getEvaluationSummary,
  isMetricsJsonV2,
  normalizeEvaluationConfig,
  type MetricsJsonV2,
} from "@/lib/evaluation-rules";
import { requireActiveUser } from "@/lib/server-auth";
import type { MetricsJson } from "@/types/dashboard";

const generateCoachNoteSchema = z.object({
  playerName: z.string().trim().min(1).max(120),
  metrics: z.unknown(),
  evaluationConfig: z.unknown().optional(),
  values: z.record(z.string(), z.number()).optional(),
});

function normalizeLegacyMetrics(metrics: unknown): MetricsJson | null {
  if (!metrics || typeof metrics !== "object") {
    return null;
  }

  const candidate = metrics as Partial<MetricsJson>;
  if (
    candidate.dribble &&
    candidate.passing &&
    typeof candidate.layUp === "number" &&
    typeof candidate.shooting === "number"
  ) {
    return candidate as MetricsJson;
  }

  return null;
}

function pickVariant(seed: number, variants: string[]) {
  return variants[Math.abs(seed) % variants.length] ?? variants[0] ?? "";
}

function normalizeScoreBand(score: number) {
  if (score >= 85) return "excellent";
  if (score >= 75) return "strong";
  if (score >= 65) return "developing";
  return "needs-work";
}

function buildPerformanceLead(score: number, playerName: string) {
  if (score >= 85) {
    return pickVariant(score, [
      `${playerName} menunjukkan perkembangan yang sangat baik pada periode ini.`,
      `Performa ${playerName} terlihat sangat kuat dan konsisten pada periode ini.`,
      `${playerName} tampil sangat baik dengan perkembangan yang semakin matang.`,
    ]);
  }

  if (score >= 75) {
    return pickVariant(score, [
      `${playerName} menunjukkan perkembangan yang baik pada periode ini.`,
      `Secara umum, performa ${playerName} berada pada jalur yang positif.`,
      `${playerName} memperlihatkan progres yang baik di beberapa aspek utama.`,
    ]);
  }

  if (score >= 65) {
    return pickVariant(score, [
      `${playerName} sudah memiliki dasar yang cukup baik dan masih perlu ditingkatkan lagi.`,
      `Performa ${playerName} cukup berkembang, meski masih membutuhkan penguatan di beberapa bagian.`,
      `${playerName} menunjukkan usaha yang baik dan masih memiliki ruang perkembangan yang jelas.`,
    ]);
  }

  return pickVariant(score, [
    `${playerName} masih membutuhkan latihan yang lebih konsisten pada aspek dasar.`,
    `Performa ${playerName} pada periode ini masih perlu banyak penguatan.`,
    `${playerName} membutuhkan fokus latihan yang lebih terarah agar perkembangannya lebih stabil.`,
  ]);
}

function buildStrengthSentence(
  categoryLabel: string,
  categoryScore: number,
  topAspectLabel?: string,
  topAspectScore?: number,
) {
  const band = normalizeScoreBand(categoryScore);

  if (topAspectLabel && typeof topAspectScore === "number") {
    if (band === "excellent" || band === "strong") {
      return pickVariant(categoryScore + topAspectLabel.length, [
        `Kekuatan utama terlihat pada ${categoryLabel.toLowerCase()}, terutama di aspek ${topAspectLabel.toLowerCase()}.`,
        `Aspek yang paling menonjol ada pada ${categoryLabel.toLowerCase()}, khususnya ${topAspectLabel.toLowerCase()}.`,
        `${categoryLabel} menjadi kekuatan utama, terutama pada ${topAspectLabel.toLowerCase()}.`,
      ]);
    }
  }

  return pickVariant(categoryScore + categoryLabel.length, [
    `${categoryLabel} menjadi kekuatan yang paling terlihat saat ini.`,
    `${categoryLabel} menjadi bagian yang relatif paling baik pada periode ini.`,
    `Performa terbaik saat ini terlihat pada kategori ${categoryLabel.toLowerCase()}.`,
  ]);
}

function buildImprovementSentence(
  categoryLabel: string,
  categoryScore: number,
  weakestAspectLabel?: string,
  weakestAspectScore?: number,
) {
  const band = normalizeScoreBand(categoryScore);

  if (weakestAspectLabel && typeof weakestAspectScore === "number") {
    if (band === "needs-work" || band === "developing") {
      return pickVariant(categoryScore + weakestAspectLabel.length * 3, [
        `Fokus perbaikan berikutnya ada pada ${categoryLabel.toLowerCase()}, terutama aspek ${weakestAspectLabel.toLowerCase()}.`,
        `Perlu perhatian lebih pada ${categoryLabel.toLowerCase()}, khususnya ${weakestAspectLabel.toLowerCase()}.`,
        `Area yang masih perlu dirapikan ada pada ${categoryLabel.toLowerCase()}, terutama ${weakestAspectLabel.toLowerCase()}.`,
      ]);
    }
  }

  return pickVariant(categoryScore + categoryLabel.length * 3, [
    `${categoryLabel} masih perlu ditingkatkan lagi agar lebih konsisten.`,
    `${categoryLabel} masih perlu menjadi fokus latihan berikutnya.`,
    `Fokus perbaikan berikutnya ada pada aspek ${categoryLabel.toLowerCase()}.`,
  ]);
}

function buildAttendanceSentence(attendance: MetricsJsonV2["attendance"]) {
  if (!attendance || attendance.totalSessions <= 0) {
    return "";
  }

  const attendedSessions = attendance.counts.HADIR;
  const missedSessions = attendance.counts.IZIN + attendance.counts.SAKIT + attendance.counts.ALPA;

  if (attendance.score >= 90) {
    return pickVariant(attendance.totalSessions + attendedSessions, [
      `Presensi sangat baik dengan ${attendedSessions}/${attendance.totalSessions} sesi hadir.`,
      `Kehadiran latihan sangat baik dengan ${attendedSessions} dari ${attendance.totalSessions} sesi.`,
    ]);
  }

  if (attendance.score >= 75) {
    return pickVariant(attendance.totalSessions + missedSessions, [
      `Presensi cukup baik, namun masih perlu dijaga karena ada ${missedSessions} sesi yang belum optimal.`,
      `Kehadiran latihan tergolong baik dan tetap perlu dijaga konsistensinya.`,
    ]);
  }

  return pickVariant(attendance.totalSessions + missedSessions * 2, [
    `Presensi masih perlu ditingkatkan karena ada ${missedSessions} sesi yang belum optimal.`,
    `Kehadiran latihan perlu lebih diperhatikan agar perkembangan teknik lebih stabil.`,
  ]);
}

function buildClosingSentence(score: number) {
  if (score >= 80) {
    return "Pertahankan konsistensi latihan agar progres positif ini terus berlanjut.";
  }

  if (score >= 65) {
    return "Dengan latihan yang lebih konsisten, hasilnya dapat meningkat dengan baik.";
  }

  return "Diperlukan komitmen latihan yang lebih teratur agar dasar teknik semakin kuat.";
}

export async function generateCoachNoteAction(input: {
  playerName: string;
  metrics: MetricsJson | MetricsJsonV2 | Record<string, number>;
  evaluationConfig?: unknown;
  values?: Record<string, number>;
}) {
  const session = await requireActiveUser();
  if (session.user.role !== "ADMIN" && session.user.role !== "COACH") {
    throw new Error("Akses ditolak untuk generate catatan pelatih.");
  }

  const parsed = generateCoachNoteSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Data nilai belum valid untuk dibuatkan catatan.");
  }

  const payload = parsed.data;
  let metrics: MetricsJson | MetricsJsonV2 | null = null;

  if (isMetricsJsonV2(payload.metrics)) {
    metrics = payload.metrics;
  } else {
    const legacyMetrics = normalizeLegacyMetrics(payload.metrics);
    if (legacyMetrics) {
      metrics = legacyMetrics;
    } else if (payload.evaluationConfig && payload.values) {
      const config = normalizeEvaluationConfig(payload.evaluationConfig);
      metrics = buildDynamicMetricsJson({
        config,
        values: payload.values,
        notes: "",
      });
    }
  }

  if (!metrics) {
    throw new Error("Nilai belum bisa diterjemahkan menjadi catatan pelatih.");
  }

  const summary = getEvaluationSummary(metrics);
  const bestCategory = [...summary.categorySummaries].sort(
    (left, right) => right.averageScore - left.averageScore,
  )[0];
  const weakestCategory = [...summary.categorySummaries].sort(
    (left, right) => left.averageScore - right.averageScore,
  )[0];
  const bestAspect = [...summary.flatRows].sort((left, right) => {
    const leftScore = left.max > 0 ? (left.value / left.max) * 100 : 0;
    const rightScore = right.max > 0 ? (right.value / right.max) * 100 : 0;
    return rightScore - leftScore;
  })[0];
  const weakestAspect = [...summary.flatRows].sort((left, right) => {
    const leftScore = left.max > 0 ? (left.value / left.max) * 100 : 0;
    const rightScore = right.max > 0 ? (right.value / right.max) * 100 : 0;
    return leftScore - rightScore;
  })[0];

  const sentences = [buildPerformanceLead(summary.totalScore, payload.playerName)];

  if (bestCategory) {
    sentences.push(
      buildStrengthSentence(
        bestCategory.label,
        bestCategory.averageScore,
        bestAspect?.label,
        bestAspect ? Math.round((bestAspect.value / bestAspect.max) * 100) : undefined,
      ),
    );
  }

  if (weakestCategory && weakestCategory.id !== bestCategory?.id) {
    sentences.push(
      buildImprovementSentence(
        weakestCategory.label,
        weakestCategory.averageScore,
        weakestAspect?.label,
        weakestAspect ? Math.round((weakestAspect.value / weakestAspect.max) * 100) : undefined,
      ),
    );
  }

  const attendanceSentence = buildAttendanceSentence(
    isMetricsJsonV2(metrics) ? metrics.attendance ?? null : null,
  );
  if (attendanceSentence) {
    sentences.push(attendanceSentence);
  }

  if (summary.totalScore < 85 || !attendanceSentence) {
    sentences.push(buildClosingSentence(summary.totalScore));
  }

  const compactNote = sentences.slice(0, attendanceSentence ? 3 : 3).join(" ");

  return {
    note: compactNote,
  };
}
