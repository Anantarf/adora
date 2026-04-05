import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEventsAction, createEventAction, deleteEventAction } from "@/actions/schedule";

export type ScheduleEvent = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  type: string;
  groupId: string | null;
  group: { name: string } | null;
};

export function useSchedule() {
  return useQuery<ScheduleEvent[]>({
    queryKey: ["schedule-events"],
    queryFn: async () => {
      const data = await getEventsAction();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function useAddEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; date: string; type: string; description?: string; groupId?: string }) => createEventAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-events"] });
      // Invalidate dashboard metrics as well to update calendar
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
