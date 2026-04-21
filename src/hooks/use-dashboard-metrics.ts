import { useQuery } from "@tanstack/react-query";
import { getDashboardMetricsAction } from "@/actions/dashboard";
import { QUERY_KEYS } from "@/lib/constants";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_METRICS,
    queryFn: getDashboardMetricsAction,
    staleTime: 1000 * 60 * 5,
  });
}
