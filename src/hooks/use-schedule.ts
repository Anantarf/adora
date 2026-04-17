import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEventsAction, createEventAction, updateEventAction, deleteEventAction } from "@/actions/schedule";
import { type ScheduleEvent } from "@/types/dashboard";
import { QUERY_KEYS } from "@/lib/constants";

export function useSchedule() {
  return useQuery<ScheduleEvent[]>({
    queryKey: QUERY_KEYS.SCHEDULE_EVENTS,
    queryFn: async () => { const res = await getEventsAction(); if (res && !Array.isArray(res) && "error" in res) throw new Error(res.error); return res as ScheduleEvent[]; },
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function useAddEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof createEventAction>[0]) => { const res = await createEventAction(data); if (res && "error" in res) throw new Error(res.error); return res; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_EVENTS });
      // Invalidate dashboard metrics as well to update calendar
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_METRICS });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Parameters<typeof updateEventAction>[1] }) => { const res = await updateEventAction(id, data); if (res && "error" in res) throw new Error(res.error); return res; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_EVENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_METRICS });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => { const res = await deleteEventAction(id); if (res && "error" in res) throw new Error(res.error); return res; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_EVENTS });
    },
  });
}
