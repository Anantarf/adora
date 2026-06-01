import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClubSettingsAction, getReportSettingsAction, updateClubSettingAction } from "@/actions/settings";
import { toast } from "sonner";
import { toUserErrorMessage } from "@/lib/utils";

export function useClubSettings() {
  return useQuery({
    queryKey: ["club-settings"],
    queryFn: () => getClubSettingsAction(),
  });
}

export function useReportSettings() {
  return useQuery({
    queryKey: ["report-settings"],
    queryFn: () => getReportSettingsAction(),
  });
}

export function useUpdateClubSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateClubSettingAction(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-settings"] });
    },
    onError: (error) => {
      toast.error(toUserErrorMessage(error, "Gagal memperbarui pengaturan."));
    },
  });
}
