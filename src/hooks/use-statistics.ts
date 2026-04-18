"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submitStatisticAction, getStatsByPeriodAction, getStatHistoryAction } from "@/actions/stats";
import { QUERY_KEYS } from "@/lib/constants";
import type { MetricsJson } from "@/types/dashboard";

// Hook (GET): Semua stats dalam suatu periode (Admin — untuk tabel per group)
export const useStatsByPeriod = (periodId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.STATISTICS_BY_PERIOD(periodId),
    queryFn: () => getStatsByPeriodAction(periodId!),
    enabled: !!periodId,
    staleTime: 1000 * 60 * 2,
  });

// Hook (GET): Riwayat revisi satu statistic record
export const useStatHistory = (statisticId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.STATISTIC_HISTORY(statisticId),
    queryFn: () => getStatHistoryAction(statisticId!),
    enabled: !!statisticId,
  });

// Hook (POST/PUT): Submit nilai (create atau update + simpan history)
export const useSubmitStatistic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { playerId: string; periodId: string; metrics: MetricsJson; status: "Draft" | "Published" }) => submitStatisticAction(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATISTICS_BY_PERIOD(variables.periodId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYER_STATS_BASE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_METRICS });
    },
  });
};
