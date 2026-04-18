"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupsAction, addGroupAction, updateGroupAction, deleteGroupAction } from "@/actions/groups";

type GroupsList = Awaited<ReturnType<typeof getGroupsAction>>;
type AddGroupInput = Parameters<typeof addGroupAction>[0];
type UpdateGroupInput = Parameters<typeof updateGroupAction>[1];
type DeleteGroupInput = Parameters<typeof deleteGroupAction>[0];

export type Group = {
  id: string;
  name: string;
  description: string | null;
  homebaseId: string | null;
  homebase: { id: string; name: string } | null;
  _count?: {
    player: number;
  };
};

// Hook (GET): Tarik data Grup Latihan via Server Action
export const useGroups = () => {
  return useQuery<GroupsList>({
    queryKey: ["groups"],
    queryFn: () => getGroupsAction(),
    staleTime: 1000 * 60 * 10, // 10 mins cache
  });
};

// Hook (POST): Tambah Grup Baru
export const useAddGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addGroupAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

// Hook (PUT): Update Grup
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupInput }) => updateGroupAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

// Hook (DELETE): Hapus Grup
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroupAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};
