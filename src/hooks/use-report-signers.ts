"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getReportSignerCoachOptionsAction,
  getReportSignerHomebaseMappingsAction,
  updateReportSignerHomebaseMappingsAction,
} from "@/actions/report-signers";
import { parseReportSignerHomebaseMappings, type ReportSignerHomebaseMapping } from "@/lib/report-signer";

const REPORT_SIGNER_QUERY_KEYS = {
  COACH_OPTIONS: ["report-signers", "coach-options"],
  HOMEBASE_MAPPINGS: ["report-signers", "homebase-mappings"],
} as const;

export const useReportSignerCoachOptions = () =>
  useQuery({
    queryKey: REPORT_SIGNER_QUERY_KEYS.COACH_OPTIONS,
    queryFn: getReportSignerCoachOptionsAction,
    staleTime: 1000 * 60 * 5,
  });

export const useReportSignerHomebaseMappings = () =>
  useQuery({
    queryKey: REPORT_SIGNER_QUERY_KEYS.HOMEBASE_MAPPINGS,
    queryFn: async () => {
      const rawValue = await getReportSignerHomebaseMappingsAction();
      return parseReportSignerHomebaseMappings(rawValue);
    },
    staleTime: 1000 * 60 * 5,
  });

export const useUpdateReportSignerHomebaseMappings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mappings: ReportSignerHomebaseMapping[]) =>
      updateReportSignerHomebaseMappingsAction(mappings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_SIGNER_QUERY_KEYS.HOMEBASE_MAPPINGS });
      queryClient.invalidateQueries({ queryKey: REPORT_SIGNER_QUERY_KEYS.COACH_OPTIONS });
      queryClient.invalidateQueries({ queryKey: ["club-settings"] });
      queryClient.invalidateQueries({ queryKey: ["report-settings"] });
      toast.success("Coach cadangan per region berhasil disimpan.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan coach cadangan per region.",
      );
    },
  });
};
