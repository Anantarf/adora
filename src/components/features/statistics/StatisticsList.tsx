"use client";

import React, { useState } from "react";
import {
  CalendarRange,
  FileText,
  LayoutList as SelectIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { AddStatDialog } from "@/components/features/AddStatDialog";
import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { GradeBadge } from "@/components/features/dashboard/GradeBadge";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DEFAULT_EVALUATION_CONFIG_V2,
  getEvaluationSummary,
  isMetricsJsonV2,
  normalizeEvaluationConfig,
  type MetricsJsonV2,
} from "@/lib/evaluation-rules";
import { PERIOD_STATUS_BADGE as STATUS_BADGE_CONFIG } from "@/lib/constants/badge-configs";
import { averageScore } from "@/lib/metrics";
import {
  resolveCoachSignerAssetUrl,
  resolveCoachSignerName,
} from "@/lib/report-signer";
import type { MetricsJson, PlayerSummary } from "@/types/dashboard";
export type SharedCategoryDefinition = {
  key: string;
  label: string;
  shortLabel?: string;
};

export type SharedStat = {
  id: string;
  metricsJson: unknown;
  status: string;
  coachNameSnapshot?: string | null;
  coachNameResolved?: string | null;
  coachSignUrlResolved?: string | null;
  resolutionSource?: "GROUP" | "HOMEBASE" | "GLOBAL" | "SNAPSHOT";
};

export type SharedPlayer = Pick<PlayerSummary, "id" | "name" | "schoolOrigin" | "group">;

export type SharedGroup = {
  id: string;
  name: string;
};

export type SharedPeriod = {
  id: string;
  name: string;
  isActive: boolean;
  evaluationConfigJson?: unknown;
  startDate?: Date | string;
  endDate?: Date | string;
};

export type StatisticsListProps = {
  selectedPeriodId: string;
  selectedPeriod: SharedPeriod | null | undefined;
  groups: SharedGroup[];
  playersByGroup: { group: SharedGroup; players: SharedPlayer[] }[];
  statsMap: Record<string, SharedStat | undefined>;
  settings?: Record<string, string> | null | undefined;
  emptyMessage: {
    noPlayersTitle: string;
    noPlayersDescription: string;
    noPeriodTitle: string;
    noPeriodDescription: string;
  };
  isLoading: boolean;
  /** Optional fallback (mis. coach-profile dari assignment) untuk signer name resolution. */
  resolveExtraCoachName?: (player: SharedPlayer) => string | null | undefined;
  /** Pesan toast untuk error preview PDF. */
  previewErrorToast?: string;
};

export function getValidMetrics(metrics: unknown): MetricsJson | MetricsJsonV2 | null {
  let data = metrics;

  if (typeof metrics === "string") {
    try {
      data = JSON.parse(metrics);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as Record<string, unknown>;
  if (isMetricsJsonV2(candidate)) {
    return candidate;
  }

  const isValid =
    candidate.dribble != null &&
    typeof candidate.dribble === "object" &&
    candidate.passing != null &&
    typeof candidate.passing === "object";

  return isValid ? (candidate as MetricsJson) : null;
}

export function periodDisplayLabel(period: {
  name: string;
  startDate?: Date | string;
  endDate?: Date | string;
}) {
  const trimmedName = (period.name || "").trim();
  if (trimmedName) {
    return trimmedName;
  }

  if (!period.startDate || !period.endDate) {
    return "Periode";
  }

  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  const startLabel = Number.isNaN(start.getTime())
    ? "?"
    : start.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  const endLabel = Number.isNaN(end.getTime())
    ? "?"
    : end.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return `Periode ${startLabel} - ${endLabel}`;
}

export function getCategoryShortLabel(label: string) {
  const words = label
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "Kategori";
  }

  if (words.length === 1) {
    return words[0];
  }

  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

function CategorySummaryChips({
  categoryDefinitions,
  metricSummary,
  compact = false,
}: {
  categoryDefinitions: SharedCategoryDefinition[];
  metricSummary: ReturnType<typeof getEvaluationSummary> | null;
  compact?: boolean;
}) {
  const hasAnyCategoryScore = categoryDefinitions.some((definition) =>
    metricSummary?.categorySummaries.some((category) => category.id === definition.key),
  );

  if (!hasAnyCategoryScore) {
    return (
      <div
        className={`rounded-xl border border-dashed border-border/50 bg-background/30 text-muted-foreground ${
          compact ? "px-3 py-2 text-xs" : "px-3.5 py-3 text-sm"
        }`}
      >
        Belum ada penilaian per kategori.
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
      {categoryDefinitions.map((definition) => {
        const value = metricSummary?.categorySummaries.find((category) => category.id === definition.key)?.averageScore;

        return (
          <div
            key={definition.key}
            className={`inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 ${
              compact ? "px-2.5 py-1.5" : "px-3 py-2"
            }`}
            title={definition.label}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {definition.shortLabel ?? definition.label}
            </p>
            <span className="h-3.5 w-px bg-border/60" />
            <p className={`${compact ? "text-sm" : "text-base"} font-bold tabular-nums text-primary`}>
              {value != null ? value : "-"}
              <span className="ml-1 text-[11px] font-medium text-muted-foreground">/100</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

function buildCategoryDefinitions(period: SharedPeriod | null | undefined): SharedCategoryDefinition[] {
  const config = period?.evaluationConfigJson
    ? normalizeEvaluationConfig(period.evaluationConfigJson)
    : DEFAULT_EVALUATION_CONFIG_V2;

  return config.categories.map((category) => ({
    key: category.id,
    label: category.label,
    shortLabel: getCategoryShortLabel(category.label),
  }));
}

type PlayerStatRowProps = {
  player: SharedPlayer;
  index: number;
  stat?: SharedStat | null;
  group: SharedGroup;
  selectedPeriod: SharedPeriod | null | undefined;
  settings?: Record<string, string> | null | undefined;
  categoryDefinitions: SharedCategoryDefinition[];
  evaluationConfig?: unknown;
  resolveExtraCoachName?: (player: SharedPlayer) => string | null | undefined;
  previewErrorToast?: string;
  /** Untuk coach: tombol preview PDF muncul walau status belum Published. */
  allowPreviewWithoutPublished?: boolean;
};

const PlayerStatRow = React.memo(function PlayerStatRow({
  player,
  index,
  stat,
  group,
  selectedPeriod,
  settings,
  categoryDefinitions,
  evaluationConfig,
  resolveExtraCoachName,
  previewErrorToast = "Gagal membuka rapor PDF. Coba lagi.",
  allowPreviewWithoutPublished = false,
}: PlayerStatRowProps) {
  const metrics = getValidMetrics(stat?.metricsJson);
  const metricSummary = metrics ? getEvaluationSummary(metrics) : null;
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const canViewReport = Boolean(
    metrics && (allowPreviewWithoutPublished || stat?.status === "Published"),
  );
  const extraCoachName = resolveExtraCoachName?.(player) ?? null;

  const coachSignerName = resolveCoachSignerName(
    stat?.coachNameResolved ?? stat?.coachNameSnapshot ?? extraCoachName,
    settings?.rapor_coach_name,
  );
  const coachSignerAssetUrl = resolveCoachSignerAssetUrl(
    stat?.coachSignUrlResolved,
    settings?.rapor_coach_sign_url,
  );

  const handleViewReport = async () => {
    if (!metrics) {
      return;
    }

    setIsPdfLoading(true);
    try {
      const { generateRaporPDF } = await import("@/lib/generate-rapor-pdf");
      await generateRaporPDF({
        playerName: player.name,
        groupName: group.name,
        schoolOrigin: player.schoolOrigin || "-",
        periodName: selectedPeriod ? selectedPeriod.name : "Periode Evaluasi",
        metrics,
        assets: {
          headerUrl: settings?.rapor_header_url ?? undefined,
          ceoSignUrl: settings?.rapor_ceo_sign_url ?? undefined,
          coachSignUrl: coachSignerAssetUrl,
          stampUrl: settings?.rapor_stamp_url ?? undefined,
        },
        signers: {
          coachName: coachSignerName,
          ceoName: settings?.rapor_ceo_name ?? undefined,
        },
        action: "preview",
      });
    } catch {
      toast.error(previewErrorToast);
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <TableRow className="transition-colors even:bg-muted/[0.08] hover:bg-muted/[0.14]">
      <TableCell className="sticky left-0 z-20 w-12 min-w-12 max-w-12 bg-card px-2 text-center font-medium text-muted-foreground">
        {index + 1}
      </TableCell>
      <TableCell className="sticky left-12 z-20 min-w-40 max-w-50 bg-card py-3 font-semibold">
        <div className="space-y-1">
          <div className="space-y-0.5">
            <p className="text-[15px] font-semibold text-foreground">{player.name}</p>
            <p className="text-[11px] text-muted-foreground">{group.name}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="min-w-[360px] py-3">
        <CategorySummaryChips categoryDefinitions={categoryDefinitions} metricSummary={metricSummary} compact />
      </TableCell>
      <TableCell className="text-center">
        {metrics ? (
          <GradeBadge score={averageScore(metrics)} />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            stat
              ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].className
              : "border-border/50 bg-background/40 text-muted-foreground"
          }`}
        >
          {stat
            ? STATUS_BADGE_CONFIG[stat.status as keyof typeof STATUS_BADGE_CONFIG].label
            : "Belum Diisi"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {canViewReport ? (
            <button
              title="Lihat Rapor PDF"
              onClick={handleViewReport}
              disabled={isPdfLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-background/40 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            >
              {isPdfLoading ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <FileText className="size-4" />
              )}
            </button>
          ) : null}
          <AddStatDialog
            player={player as unknown as PlayerSummary}
            periodId={selectedPeriod?.id}
            isPeriodActive={selectedPeriod?.isActive}
            existingStat={
              stat
                ? {
                    id: stat.id,
                    metrics: stat.metricsJson as MetricsJson | MetricsJsonV2,
                    status: stat.status as "Draft" | "Published",
                  }
                : undefined
            }
            evaluationConfig={evaluationConfig}
          />
        </div>
      </TableCell>
    </TableRow>
  );
});

export function StatisticsList(props: StatisticsListProps) {
  const {
    selectedPeriodId,
    selectedPeriod,
    playersByGroup,
    statsMap,
    settings,
    emptyMessage,
    isLoading,
    resolveExtraCoachName,
    previewErrorToast,
  } = props;

  const categoryDefinitions = React.useMemo(
    () => buildCategoryDefinitions(selectedPeriod),
    [selectedPeriod],
  );
  const evaluationConfig = selectedPeriod?.evaluationConfigJson;

  return (
    <>
      {!selectedPeriodId ? (
        <AdminStatePanel
          icon={CalendarRange}
          title={emptyMessage.noPeriodTitle}
          description={emptyMessage.noPeriodDescription}
          className="bg-card"
        />
      ) : null}

      {selectedPeriodId && isLoading ? (
        <div className="hidden min-h-[300px] w-full rounded-xl border border-border/50 bg-card p-4 lg:block">
          <div className="space-y-3">
            <Skeleton className="h-11 w-full rounded-xl bg-muted/25" />
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg bg-muted/15" />
            ))}
          </div>
        </div>
      ) : null}

      {selectedPeriodId && isLoading ? (
        <div className="space-y-3 lg:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-xl bg-muted/20" />
          ))}
        </div>
      ) : null}

      {selectedPeriodId && !isLoading ? (
        <div className="space-y-4 lg:hidden">
          {playersByGroup.length === 0 ? (
            <AdminStatePanel
              icon={CalendarRange}
              title={emptyMessage.noPlayersTitle}
              description={emptyMessage.noPlayersDescription}
              className="min-h-56 bg-card"
            />
          ) : null}

          {playersByGroup.map(({ group, players }) => (
            <section
              key={group.id}
              className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-2.5">
                <span className="text-xs font-semibold text-primary">{group.name}</span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {players.length} pemain
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {players.map((player, index) => {
                  const stat = statsMap[player.id];
                  return (
                    <PlayerStatRow
                      key={player.id}
                      player={player}
                      index={index}
                      stat={stat}
                      group={group}
                      selectedPeriod={selectedPeriod}
                      settings={settings}
                      categoryDefinitions={categoryDefinitions}
                      evaluationConfig={evaluationConfig}
                      resolveExtraCoachName={resolveExtraCoachName}
                      previewErrorToast={previewErrorToast}
                      allowPreviewWithoutPublished
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {selectedPeriodId && !isLoading ? (
        <div className="hidden overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm lg:block">
          <Table className="min-w-[920px]">
            <TableHeader className="bg-muted/[0.16]">
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="sticky left-0 z-20 w-12 min-w-12 max-w-12 bg-muted/20 px-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  No
                </TableHead>
                <TableHead className="sticky left-12 z-20 min-w-40 max-w-52 bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Nama Pemain
                </TableHead>
                <TableHead className="min-w-[320px] px-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Ringkasan Kategori
                </TableHead>
                <TableHead className="w-20 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Nilai
                </TableHead>
                <TableHead className="w-20 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Status
                </TableHead>
                <TableHead className="w-24 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playersByGroup.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <AdminStatePanel
                      title={emptyMessage.noPlayersTitle}
                      description={emptyMessage.noPlayersDescription}
                      className="min-h-40 border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : null}

              {playersByGroup.map(({ group, players }) => (
                <React.Fragment key={group.id}>
                  <TableRow className="bg-muted/[0.12] hover:bg-muted/[0.12]">
                    <TableCell
                      colSpan={6}
                      className="border-l-4 border-primary py-2.5 pl-3 text-sm font-semibold text-primary"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{group.name}</span>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {players.length} pemain
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {players.map((player, index) => {
                    const stat = statsMap[player.id];
                    return (
                      <PlayerStatRow
                        key={player.id}
                        player={player}
                        index={index}
                        stat={stat}
                        group={group}
                        selectedPeriod={selectedPeriod}
                        settings={settings}
                        categoryDefinitions={categoryDefinitions}
                        evaluationConfig={evaluationConfig}
                        resolveExtraCoachName={resolveExtraCoachName}
                        previewErrorToast={previewErrorToast}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </>
  );
}

// Re-export untuk consumer yang butuh ikon kontrol filter (periode + kelompok).
export const FILTER_ICONS = {
  CalendarRange,
  SelectIcon,
} as const;
