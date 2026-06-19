"use client";

import { useQuery } from "@tanstack/react-query";

import { getFamilyPlayersAction, getParentsAction, getPlayerAttendanceAction } from "@/actions/family";
import { QUERY_KEYS } from "@/lib/constants";

export type FamilyPlayer = {
  id: string;
  name: string;
  dateOfBirth: Date | string;
  placeOfBirth: string | null;
  gender: string | null;
  photoUrl: string | null;
  schoolOrigin: string | null;
  group: {
    id: string;
    name: string;
    coachAssignment: {
      coachProfile: {
        id: string;
        fullName: string;
        photoUrl: string | null;
        licenseUrl: string | null;
      };
    } | null;
  } | null;
  resolvedSigner?: {
    coachNameSnapshot: string | null;
    coachSignUrlSnapshot: string | null;
    resolutionSource: "GROUP" | "HOMEBASE" | "GLOBAL";
  };
  fallbackCoachProfile?: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    licenseUrl: string | null;
  } | null;
};

export type ParentUser = {
  id: string;
  name: string | null;
  username: string | null;
};

export function useFamily(options?: { initialData?: FamilyPlayer[]; initialDataUpdatedAt?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.FAMILY_PLAYERS,
    queryFn: () => getFamilyPlayersAction(),
    staleTime: 1000 * 60 * 5,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialDataUpdatedAt,
  });
}

export function usePlayerAttendance(
  playerId: string | null,
  options?: {
    initialData?: Awaited<ReturnType<typeof getPlayerAttendanceAction>>;
    initialDataUpdatedAt?: number;
  },
) {
  return useQuery({
    queryKey: ["player-attendance", playerId],
    queryFn: () => getPlayerAttendanceAction(playerId!),
    enabled: !!playerId,
    staleTime: 1000 * 60 * 5,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialDataUpdatedAt,
  });
}

export function useParents() {
  return useQuery<ParentUser[]>({
    queryKey: QUERY_KEYS.PARENTS,
    queryFn: () => getParentsAction(),
    staleTime: 1000 * 60 * 5,
  });
}
