"use client";
import { useQuery } from "@tanstack/react-query";
import { getPlayerStatsAction } from "@/actions/stats";

export type MetricsJson = {
  shooting: number;
  dribbling: number;
  passing: number;
  stamina: number;
  attitude: number;
  notes?: string;
};

export type PlayerStatRecord = {
  id: string;
  date: Date;
  status: string;
  metricsJson: MetricsJson;
  playerId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Hook (GET): Tarik data evaluasi rapor pemain via Server Action MySQL
export const usePlayerStats = (playerId: string | null) => {
  return useQuery({
    queryKey: ["player-stats", playerId],
    queryFn: () => getPlayerStatsAction(playerId!),
    enabled: !!playerId,
    staleTime: 1000 * 60 * 10, // 10 menit cache
  });
};
