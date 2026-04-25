"use client";
import { useQuery } from "@tanstack/react-query";
import { getPlayerStatsAction } from "@/actions/stats";
import { QUERY_KEYS } from "@/lib/constants";
import type { MetricsJson, StatisticHistory } from "@/types/dashboard";

export type { MetricsJson };

export type PlayerStatRecord = {
  id: string;
  date: Date;
  status: string;
  metricsJson: MetricsJson;
  playerId: string;
  periodId: string | null;
  createdAt: Date;
  updatedAt: Date;
  period?: { id: string; name: string } | null;
  history?: StatisticHistory[];
};

// Hook (GET): Tarik data evaluasi rapor pemain via Server Action MySQL
export const usePlayerStats = (playerId: string | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.PLAYER_STATS(playerId!),
    queryFn: () => getPlayerStatsAction(playerId!),
    enabled: !!playerId,
    staleTime: 1000 * 60 * 10, // 10 menit cache
  });
};
