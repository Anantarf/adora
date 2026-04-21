"use client";
import { useQuery } from "@tanstack/react-query";
import { getEventsWithAttendanceAction } from "@/actions/schedule";
import { QUERY_KEYS } from "@/lib/constants";

export const useEventsWithAttendance = () => {
  return useQuery({
    queryKey: QUERY_KEYS.EVENTS_WITH_ATTENDANCE,
    queryFn: () => getEventsWithAttendanceAction(),
    staleTime: 1000 * 60 * 5,
  });
};
