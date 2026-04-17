"use client";
import { useQuery } from "@tanstack/react-query";
import { getEventsWithAttendanceAction } from "@/actions/schedule";

export const useEventsWithAttendance = () => {
  return useQuery({
    queryKey: ["events-attendance"],
    queryFn: () => getEventsWithAttendanceAction(),
  });
};
