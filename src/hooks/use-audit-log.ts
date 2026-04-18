"use client";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogsAction, type AuditLogRecord } from "@/actions/audit";
import { QUERY_KEYS } from "@/lib/constants";

export type { AuditLogRecord };

// Hook (GET): Tarik audit log terbaru (Admin)
export const useAuditLogs = (cursor?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.AUDIT_LOGS(cursor),
    queryFn: () => getAuditLogsAction({ take: 50, cursor }),
    staleTime: 1000 * 60 * 2, // 2 menit (audit log berubah sering)
  });
};
