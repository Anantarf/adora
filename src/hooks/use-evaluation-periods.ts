"use client";
import { unwrapAction } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPeriodsAction,
  getActivePeriodAction,
  createPeriodAction,
  setActivePeriodAction,
  deletePeriodAction,
} from "@/actions/evaluation-periods";

type PeriodsList = Awaited<ReturnType<typeof getPeriodsAction>>;
type ActivePeriod = Awaited<ReturnType<typeof getActivePeriodAction>>;
type CreatePeriodInput = Parameters<typeof createPeriodAction>[0];
type SetActivePeriodInput = Parameters<typeof setActivePeriodAction>[0];
type DeletePeriodInput = Parameters<typeof deletePeriodAction>[0];

export const usePeriods = () =>
  useQuery<PeriodsList>({
    queryKey: ["evaluation-periods"],
    queryFn: getPeriodsAction,
    staleTime: 1000 * 60 * 5,
  });

export const useActivePeriod = () =>
  useQuery<ActivePeriod>({
    queryKey: ["evaluation-periods", "active"],
    queryFn: getActivePeriodAction,
    staleTime: 1000 * 60 * 5,
  });

export const useCreatePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePeriodInput) => createPeriodAction(data).then(unwrapAction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] }),
  });
};

export const useSetActivePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetActivePeriodInput) => setActivePeriodAction(data).then(unwrapAction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] }),
  });
};

export const useDeletePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeletePeriodInput) => deletePeriodAction(data).then(unwrapAction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] }),
  });
};
