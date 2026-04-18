"use client";
import { unwrapAction } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlayersAction, addPlayerAction, updatePlayerAction, deletePlayerAction, addBatchPlayersAction } from "@/actions/players";
import { QUERY_KEYS } from "@/lib/constants";

type PlayersList = Awaited<ReturnType<typeof getPlayersAction>>;
type AddPlayerInput = Parameters<typeof addPlayerAction>[0];
type UpdatePlayerInput = Parameters<typeof updatePlayerAction>[1];
type DeletePlayerInput = Parameters<typeof deletePlayerAction>[0];
type AddBatchPlayersInput = Parameters<typeof addBatchPlayersAction>[0];

/**
 * ADORA Basketball - Lean Player Management Hooks
 * Declarative patterns using TanStack Query and Server Actions.
 */

// 1. Hook (GET): Tarik data pemain via Server Action
export const usePlayers = (groupId?: string, searchQuery?: string, enabled = true) => {
  return useQuery<PlayersList>({
    queryKey: [...QUERY_KEYS.PLAYERS(groupId), searchQuery],
    queryFn: () => getPlayersAction(groupId, searchQuery),
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

// 2. Hook (POST): Tambah Pemain Baru
export const useAddPlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPlayerInput) => addPlayerAction(data).then(unwrapAction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYERS_BASE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS });
    },
  });
};

// 3. Hook (PATCH): Update Profile Pemain
export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlayerInput }) => updatePlayerAction(id, data).then(unwrapAction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYERS_BASE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS });
    },
  });
};

// 4. Hook (DELETE): Hapus Pemain (Soft Delete)
export const useDeletePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeletePlayerInput) => deletePlayerAction(data).then(unwrapAction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYERS_BASE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS });
    },
  });
};

// 5. Hook (POST): Tambah Pemain Massal
export const useAddBatchPlayers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddBatchPlayersInput) => addBatchPlayersAction(data).then(unwrapAction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYERS_BASE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GROUPS });
    },
  });
};
