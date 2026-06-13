"use client";

import { useQuery } from "@tanstack/react-query";

import { getPlayerStatsAction } from "@/actions/stats";
import { QUERY_KEYS } from "@/lib/constants";
import type { MetricsJson, StatisticHistory } from "@/types/dashboard";
import type { MetricsJsonV2 } from "@/lib/evaluation-rules";

export type { MetricsJson };

export type PlayerStatRecord = {
  id: string;
  date: Date;
  status: string;
  metricsJson: MetricsJson | MetricsJsonV2;
  playerId: string;
  periodId: string | null;
  createdAt: Date;
  updatedAt: Date;
  period?: { id: string; name: string; startDate: Date | string; endDate: Date | string } | null;
  history?: StatisticHistory[];
};

export const usePlayerStats = (playerId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.PLAYER_STATS(playerId!),
    queryFn: () => getPlayerStatsAction(playerId!),
    enabled: !!playerId,
    staleTime: 1000 * 60 * 10,
  });
