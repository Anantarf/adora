"use client";

import { useQuery } from "@tanstack/react-query";

import { getPlayerStatsAction } from "@/actions/stats";
import { QUERY_KEYS } from "@/lib/constants";
import type { MetricsJson } from "@/types/dashboard";

export type { MetricsJson };

// Tipe data pemain stats mengikuti return server action (lebih lengkap dari versi
// sebelumnya). Disimpan sebagai alias agar sisi client tidak perlu duplikasi.
export type PlayerStatRecord = Awaited<ReturnType<typeof getPlayerStatsAction>>[number];

export function usePlayerStats(
  playerId: string | null,
  options?: { initialData?: PlayerStatRecord[]; initialDataUpdatedAt?: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.PLAYER_STATS(playerId!),
    queryFn: () => getPlayerStatsAction(playerId!),
    enabled: !!playerId,
    staleTime: 1000 * 60 * 10,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialDataUpdatedAt,
  });
}
