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

export const usePeriods = () =>
  useQuery({
    queryKey: ["evaluation-periods"],
    queryFn: getPeriodsAction,
    staleTime: 1000 * 60 * 5,
  });

export const useActivePeriod = () =>
  useQuery({
    queryKey: ["evaluation-periods", "active"],
    queryFn: getActivePeriodAction,
    staleTime: 1000 * 60 * 5,
  });

export const useCreatePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createPeriodAction(data).then(unwrapAction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] }),
  });
};

export const useSetActivePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => setActivePeriodAction(data).then(unwrapAction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] }),
  });
};

export const useDeletePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => deletePeriodAction(data).then(unwrapAction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] }),
  });
};
