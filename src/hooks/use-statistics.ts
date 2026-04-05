"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submitStatisticAction, getPlayerStatsAction } from "@/actions/stats";

export type StatMetrics = {
  shooting: number;
  dribbling: number;
  passing: number;
  stamina: number;
  attitude: number;
  notes: string;
};

// Hook (GET): Tarik Rapor Pemain via Server Action
export const useStatistics = (playerId: string) => {
  return useQuery({
    queryKey: ["statistics", playerId],
    queryFn: () => getPlayerStatsAction(playerId),
    enabled: !!playerId,
  });
};

// Hook (POST): Simpan Nilai Evaluasi Rapor via Server Action
export const useAddStatistic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      playerId: string;
      date: string;
      metrics: StatMetrics;
      status: "Draft" | "Published";
    }) => {
      // Logic evaluator_id dihandle di server session (Dashboard Action)
      return await submitStatisticAction(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
};
