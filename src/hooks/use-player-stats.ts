"use client";
import { useQuery } from "@tanstack/react-query";
import { getPlayerStatsAction } from "@/actions/stats";

export type PlayerStatRecord = {
  id: string;
  date: Date;
  status: string;
  metricsJson: any; // Prisma stores Json as field
  evaluatorId: string;
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
