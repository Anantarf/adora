import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEventsAction, createEventAction, updateEventAction, deleteEventAction } from "@/actions/schedule";
import { type ScheduleEvent } from "@/types/dashboard";
import { QUERY_KEYS } from "@/lib/constants";

export function useSchedule() {
  return useQuery<ScheduleEvent[]>({
    queryKey: QUERY_KEYS.SCHEDULE_EVENTS,
    queryFn: () => getEventsAction(),
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function useAddEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; date: string; type: string; location?: string; description?: string; groupId?: string; homebaseId?: string }) => createEventAction(data),
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
    mutationFn: ({ id, data }: { id: string; data: { title: string; date: string; type: string; location?: string; description?: string; groupId?: string; homebaseId?: string } }) => updateEventAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_EVENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_METRICS });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEventAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE_EVENTS });
    },
  });
}
