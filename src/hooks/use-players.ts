"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlayersAction, addPlayerAction, updatePlayerAction, deletePlayerAction, addBatchPlayersAction } from "@/actions/players";
import { QUERY_KEYS } from "@/lib/constants";

/**
 * ADORA Basketball - Lean Player Management Hooks
 * Declarative patterns using TanStack Query and Server Actions.
 */

// 1. Hook (GET): Tarik data pemain via Server Action
export const usePlayers = (groupId?: string, searchQuery?: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.PLAYERS(groupId), searchQuery],
    queryFn: () => getPlayersAction(groupId, searchQuery),
    staleTime: 1000 * 60 * 5,
  });
};

// 2. Hook (POST): Tambah Pemain Baru
export const useAddPlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPlayerAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYERS_BASE });
    },
  });
};

// 3. Hook (PATCH): Update Profile Pemain
export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; dateOfBirth?: string; schoolOrigin?: string; groupId?: string; parentId?: string } }) => updatePlayerAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYERS_BASE });
    },
  });
};

// 4. Hook (DELETE): Hapus Pemain (Soft Delete)
export const useDeletePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlayerAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYERS_BASE });
    },
  });
};

// 5. Hook (POST): Tambah Pemain Massal
export const useAddBatchPlayers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addBatchPlayersAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYERS_BASE });
    },
  });
};
