"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPeriodsAction, getActivePeriodAction, createPeriodAction, setActivePeriodAction, deletePeriodAction } from "@/actions/evaluation-periods";
import { QUERY_KEYS } from "@/lib/constants";

type PeriodsList = Awaited<ReturnType<typeof getPeriodsAction>>;
type ActivePeriod = Awaited<ReturnType<typeof getActivePeriodAction>>;
type CreatePeriodInput = Parameters<typeof createPeriodAction>[0];
type SetActivePeriodInput = Parameters<typeof setActivePeriodAction>[0];
type DeletePeriodInput = Parameters<typeof deletePeriodAction>[0];

export const usePeriods = () =>
  useQuery<PeriodsList>({
    queryKey: QUERY_KEYS.EVALUATION_PERIODS_BASE,
    queryFn: getPeriodsAction,
    staleTime: 1000 * 60 * 5,
  });

export const useActivePeriod = () =>
  useQuery<ActivePeriod>({
    queryKey: QUERY_KEYS.EVALUATION_PERIODS_ACTIVE,
    queryFn: getActivePeriodAction,
    staleTime: 1000 * 60 * 5,
  });

export const useCreatePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPeriodAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EVALUATION_PERIODS_BASE }),
  });
};

export const useSetActivePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setActivePeriodAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EVALUATION_PERIODS_BASE }),
  });
};

export const useDeletePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePeriodAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EVALUATION_PERIODS_BASE }),
  });
};
