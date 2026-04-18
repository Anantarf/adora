"use client";
import { unwrapAction } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAttendancesAction } from "@/actions/dashboard";
import { submitAttendanceAction } from "@/actions/stats";
import { QUERY_KEYS } from "@/lib/constants";
import { type AttendanceStatus } from "@/types/dashboard";

type AttendancesList = Awaited<ReturnType<typeof getAttendancesAction>>;
type SubmitAttendanceInput = Parameters<typeof submitAttendanceAction>[0];

export type AttendanceInput = {
  playerId: string;
  status: AttendanceStatus;
  note?: string;
};

// Hook (GET): Tarik presensi tersimpan via Server Action
export const useAttendances = (date: string, groupId?: string) => {
  return useQuery<AttendancesList>({
    queryKey: QUERY_KEYS.ATTENDANCES(date, groupId),
    queryFn: () => getAttendancesAction(date, groupId),
    enabled: !!date,
  });
};

// Hook (POST): Simpan Presensi Masal (Batch Upsert) via Server Action
export const useAddAttendances = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitAttendanceInput) => submitAttendanceAction(data).then(unwrapAction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCES_BASE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_METRICS });
    },
  });
};
