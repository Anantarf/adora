"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupsAction, addGroupAction, updateGroupAction, deleteGroupAction } from "@/actions/groups";

export type Group = {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    player: number;
  };
};

// Hook (GET): Tarik data Grup Latihan via Server Action
export const useGroups = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => getGroupsAction(),
    staleTime: 1000 * 60 * 10, // 10 mins cache
  });
};

// Hook (POST): Tambah Grup Baru
export const useAddGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newGroup: { name: string; description?: string }) => {
      return await addGroupAction(newGroup);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

// Hook (PUT): Update Grup
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string } }) => {
      return await updateGroupAction(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

// Hook (DELETE): Hapus Grup
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteGroupAction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};
