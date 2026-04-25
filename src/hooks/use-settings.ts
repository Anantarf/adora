import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClubSettingsAction, updateClubSettingAction } from "@/actions/settings";
import { toast } from "sonner";

export function useClubSettings() {
  return useQuery({
    queryKey: ["club-settings"],
    queryFn: () => getClubSettingsAction(),
  });
}

export function useUpdateClubSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateClubSettingAction(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-settings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui pengaturan.");
    },
  });
}
