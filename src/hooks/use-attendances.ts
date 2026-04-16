"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAttendancesAction } from "@/actions/dashboard";
import { submitAttendanceAction } from "@/actions/stats";
import { type AttendanceStatus } from "@/types/dashboard";

export type AttendanceInput = {
  playerId: string;
  status: AttendanceStatus;
  note?: string;
};

// Hook (GET): Tarik presensi tersimpan via Server Action
export const useAttendances = (date: string, groupId?: string) => {
  return useQuery({
    queryKey: ["attendances", date, groupId],
    queryFn: () => getAttendancesAction(date, groupId),
    enabled: !!date,
  });
};

// Hook (POST): Simpan Presensi Masal (Batch Upsert) via Server Action
export const useAddAttendances = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitAttendanceAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
};
