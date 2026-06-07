"use client";

import { useQuery } from "@tanstack/react-query";

import { getCoachWorkspaceAction } from "@/actions/coach-workspace";
import { QUERY_KEYS } from "@/lib/constants";

export type CoachWorkspaceData = Awaited<ReturnType<typeof getCoachWorkspaceAction>>;

export const useCoachWorkspace = () =>
  useQuery<CoachWorkspaceData>({
    queryKey: QUERY_KEYS.COACH_WORKSPACE,
    queryFn: getCoachWorkspaceAction,
    staleTime: 1000 * 60 * 5,
  });
