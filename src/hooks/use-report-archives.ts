"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getReleasedReportArchivesForPlayerAction,
  getReportArchiveRowsAction,
  releaseReportArchiveAction,
  upsertReportArchiveDraftAction,
} from "@/actions/report-archives";

export const useReportArchiveRows = (
  groupId: string | null,
  periodId: string | null,
  enabled = true,
) =>
  useQuery({
    queryKey: ["report-archives", "rows", groupId, periodId],
    queryFn: () => getReportArchiveRowsAction(groupId!, periodId!),
    enabled: enabled && !!groupId && !!periodId,
    staleTime: 1000 * 60 * 2,
  });

export const useReleasedReportArchives = (playerId: string | null) =>
  useQuery({
    queryKey: ["report-archives", "released", playerId],
    queryFn: () => getReleasedReportArchivesForPlayerAction(playerId!),
    enabled: !!playerId,
    staleTime: 1000 * 60 * 5,
  });

export const useUpsertReportArchiveDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertReportArchiveDraftAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["report-archives"] });
      queryClient.invalidateQueries({
        queryKey: ["report-archives", "released", variables.playerId],
      });
      toast.success("Arsip rapor draft berhasil disimpan.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan arsip rapor.");
    },
  });
};

export const useReleaseReportArchive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: releaseReportArchiveAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-archives"] });
      toast.success("Arsip rapor berhasil dirilis.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal merilis arsip rapor.");
    },
  });
};
