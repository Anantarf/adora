"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getStatHistoryAction, getStatsByPeriodAction, submitStatisticAction } from "@/actions/stats";
import { QUERY_KEYS } from "@/lib/constants";
import type { MetricsJson } from "@/types/dashboard";
import type { MetricsJsonV2 } from "@/lib/evaluation-rules";

export const useStatsByPeriod = (periodId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.STATISTICS_BY_PERIOD(periodId),
    queryFn: () => getStatsByPeriodAction(periodId!),
    enabled: !!periodId,
    staleTime: 1000 * 60 * 2,
  });

export const useStatHistory = (statisticId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.STATISTIC_HISTORY(statisticId),
    queryFn: () => getStatHistoryAction(statisticId!),
    enabled: !!statisticId,
  });

export const useSubmitStatistic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      playerId: string;
      periodId: string;
      metrics: MetricsJson | MetricsJsonV2 | Record<string, number>;
      status: "Draft" | "Published";
      notes?: string;
    }) => submitStatisticAction(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.STATISTICS_BY_PERIOD(variables.periodId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYER_STATS_BASE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_METRICS });
    },
  });
};
