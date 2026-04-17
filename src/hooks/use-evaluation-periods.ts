"use client";
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
    mutationFn: createPeriodAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] }),
  });
};

export const useSetActivePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setActivePeriodAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] }),
  });
};

export const useDeletePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePeriodAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] }),
  });
};
