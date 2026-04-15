import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEventsAction, createEventAction, updateEventAction, deleteEventAction } from "@/actions/schedule";
import { type ScheduleEvent } from "@/types/dashboard";

export function useSchedule() {
  return useQuery<ScheduleEvent[]>({
    queryKey: ["schedule-events"],
    queryFn: () => getEventsAction(),
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function useAddEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; date: string; type: string; location?: string; description?: string; groupId?: string; homebaseId?: string }) => createEventAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-events"] });
      // Invalidate dashboard metrics as well to update calendar
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; date: string; type: string; location?: string; description?: string; groupId?: string; homebaseId?: string } }) =>
      updateEventAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEventAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-events"] });
    },
  });
}
