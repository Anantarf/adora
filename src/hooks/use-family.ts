"use client";
import { useQuery } from "@tanstack/react-query";
import { getFamilyPlayersAction } from "@/actions/family";

export type FamilyPlayer = {
  id: string;
  name: string;
  dateOfBirth: Date;
  group: { id: string; name: string } | null;
};

// Hook (GET): Tarik data anak (pemain) milik orang tua yang sedang login via Server Action
export const useFamily = () => {
  return useQuery({
    queryKey: ["family-players"],
    queryFn: () => getFamilyPlayersAction(),
    staleTime: 1000 * 60 * 30, // 30 menit cache karena data anak jarang berubah
  });
};
