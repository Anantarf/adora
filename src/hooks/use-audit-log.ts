"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { getAuditLogsAction, type AuditLogRecord } from "@/actions/audit";
import { DEFAULT_AUDIT_PAGE_SIZE, QUERY_KEYS } from "@/lib/constants";

export type { AuditLogRecord };

export const useAuditLogs = () =>
  useInfiniteQuery({
    queryKey: QUERY_KEYS.AUDIT_LOGS_BASE,
    queryFn: ({ pageParam }: { pageParam?: string | null }) =>
      getAuditLogsAction({
        take: DEFAULT_AUDIT_PAGE_SIZE,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 2,
  });
