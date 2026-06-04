"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getCoachProfileByUserAction,
  getOwnCoachProfileAction,
  upsertCoachProfileAction,
  upsertOwnCoachProfileAction,
} from "@/actions/coach-profiles";

export type CoachUserWithProfile = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  coachProfile: {
    id: string;
    fullName: string;
    placeOfBirth: string | null;
    dateOfBirth: Date | null | string;
    gender: string | null;
    photoUrl: string | null;
    licenseUrl: string | null;
    isDeleted: boolean;
    assignments: Array<{
      group: {
        id: string;
        name: string;
      };
    }>;
  } | null;
};

export const useCoachProfileByUser = (userId: string | null, enabled = true) =>
  useQuery<CoachUserWithProfile>({
    queryKey: ["coach-profile", userId],
    queryFn: async () => {
      const res = await getCoachProfileByUserAction(userId!);
      return res as CoachUserWithProfile;
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5,
  });

export const useMyCoachProfile = () =>
  useQuery<CoachUserWithProfile>({
    queryKey: ["coach-profile", "me"],
    queryFn: async () => {
      const res = await getOwnCoachProfileAction();
      return res as CoachUserWithProfile;
    },
    staleTime: 1000 * 60 * 5,
  });

export const useUpsertCoachProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertCoachProfileAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coach-profile", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Profil coach berhasil disimpan.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan profil coach.");
    },
  });
};

export const useUpsertOwnCoachProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertOwnCoachProfileAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-profile", "me"] });
      toast.success("Profil coach berhasil diperbarui.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui profil coach.");
    },
  });
};
