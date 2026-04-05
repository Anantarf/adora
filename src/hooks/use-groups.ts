"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupsAction, addGroupAction } from "@/actions/groups";

export type Group = {
  id: string;
  name: string;
  description: string | null;
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
