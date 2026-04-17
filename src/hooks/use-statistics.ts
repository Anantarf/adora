"use client";
import { unwrapAction } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitStatisticAction,
  getStatsByPeriodAction,
  getStatHistoryAction,
} from "@/actions/stats";
import type { MetricsJson } from "@/types/dashboard";

// Hook (GET): Semua stats dalam suatu periode (Admin — untuk tabel per group)
export const useStatsByPeriod = (periodId: string | null) =>
  useQuery({
    queryKey: ["statistics-period", periodId],
    queryFn: () => getStatsByPeriodAction(periodId!),
    enabled: !!periodId,
    staleTime: 1000 * 60 * 2,
  });

// Hook (GET): Riwayat revisi satu statistic record
export const useStatHistory = (statisticId: string | null) =>
  useQuery({
    queryKey: ["statistic-history", statisticId],
    queryFn: () => getStatHistoryAction(statisticId!),
    enabled: !!statisticId,
  });

// Hook (POST/PUT): Submit nilai (create atau update + simpan history)
export const useSubmitStatistic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      playerId: string;
      periodId: string;
      metrics: MetricsJson;
      status: "Draft" | "Published";
    }) => submitStatisticAction(data).then(unwrapAction),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["statistics-period", variables.periodId] });
      queryClient.invalidateQueries({ queryKey: ["player-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
};
