"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlayersAction, addPlayerAction, updatePlayerAction, deletePlayerAction } from "@/actions/players";
import { type Player } from "@/types/dashboard";

// 1. Hook (GET): Tarik data pemain via Server Action
export const usePlayers = (groupId?: string) => {
  return useQuery({
    queryKey: ["players", groupId],
    queryFn: () => getPlayersAction(groupId),
    staleTime: 1000 * 60 * 5, // Fresh for 5 mins
  });
};

// 2. Hook (POST): Tambah Pemain Baru
export const useAddPlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      dateOfBirth: string;
      schoolOrigin: string;
      groupId: string;
      parentId: string;
    }) => {
      return await addPlayerAction(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
};

// 3. Hook (PATCH): Update Profile Pemain
export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Player, "id">> }) => {
      // Perlu konversi date ke string ISO jika UI mengirim Date object
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth instanceof Date ? data.dateOfBirth.toISOString() : data.dateOfBirth
      };
      return await updatePlayerAction(id, formattedData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
};

// 4. Hook (DELETE): Hapus Pemain (Soft Delete)
export const useDeletePlayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deletePlayerAction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
};

// 5. Hook (POST): Tambah Pemain Massal
export const useAddBatchPlayers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Array<{
      name: string;
      dateOfBirth: string;
      schoolOrigin?: string;
      groupId: string;
      parentId: string;
    }>) => {
      const { addBatchPlayersAction } = await import("@/actions/players");
      return await addBatchPlayersAction(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
};
