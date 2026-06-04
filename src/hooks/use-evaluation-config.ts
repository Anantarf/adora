"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getEvaluationConfigAction,
  updateEvaluationConfigAction,
} from "@/actions/evaluation-config";

export const useEvaluationConfig = () =>
  useQuery({
    queryKey: ["evaluation-config"],
    queryFn: getEvaluationConfigAction,
    staleTime: 1000 * 60 * 5,
  });

export const useUpdateEvaluationConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEvaluationConfigAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-config"] });
      queryClient.invalidateQueries({ queryKey: ["evaluation-periods"] });
    },
  });
};
