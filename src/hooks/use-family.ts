"use client";
import { useQuery } from "@tanstack/react-query";
import { getFamilyPlayersAction, getParentsAction } from "@/actions/family";
import { QUERY_KEYS } from "@/lib/constants";

export type FamilyPlayer = {
  id: string;
  name: string;
  dateOfBirth: Date;
  group: { id: string; name: string } | null;
};

export type ParentUser = {
  id: string;
  name: string | null;
  username: string | null;
};

// Hook (GET): Tarik data anak (pemain) milik orang tua yang sedang login via Server Action
export const useFamily = () => {
  return useQuery({
    queryKey: QUERY_KEYS.FAMILY_PLAYERS,
    queryFn: () => getFamilyPlayersAction(),
    staleTime: 1000 * 60 * 30, // 30 menit cache karena data anak jarang berubah
  });
};

// Hook (GET): Tarik daftar akun Parent (Admin only) — untuk form registrasi pemain
export const useParents = () => {
  return useQuery<ParentUser[]>({
    queryKey: QUERY_KEYS.PARENTS,
    queryFn: () => getParentsAction(),
    staleTime: 1000 * 60 * 5,
  });
};
