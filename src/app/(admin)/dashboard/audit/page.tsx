"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { ChevronRight, Clock, FileText, Loader2, RefreshCw, ShieldAlert, User } from "lucide-react";

import { useAuditLogs, type AuditLogRecord } from "@/hooks/use-audit-log";
import { useGroups } from "@/hooks/use-groups";
import { useHomebases } from "@/hooks/use-homebases";
import { AdminPageHeader } from "@/components/features/admin-page-header";
import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AUDIT_ACTION_CONFIG as ACTION_CONFIG,
  getAuditActionConfig as getActionConfig,
  type AuditActionKey as ActionKey,
} from "@/lib/constants/badge-configs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  extractTargetName,
  formatValue,
  getFieldLabel,
  getHumanReadableTable,
  getHumanReadableText,
  TIMESTAMP_FORMATTER,
  type AuditValueLookups,
} from "@/lib/utils/audit-log";

function DetailRows({
  data,
  lookups,
}: {
  data: Record<string, unknown>;
  lookups?: AuditValueLookups;
}) {
  const rows = Object.entries(data).filter(([key]) => !key.startsWith("_"));

  return (
    <div className="flex flex-col gap-2">
      {rows.map(([key, value]) => (
        <div
          key={key}
          className="flex items-start gap-3 border-b border-border/30 py-2 last:border-0"
        >
          <span className="w-32 shrink-0 pt-0.5 text-xs text-muted-foreground">
            {getFieldLabel(key)}
          </span>
          <span className="text-sm font-medium text-foreground">
            {formatValue(key, value, lookups)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AuditDetailBody({
  log,
  lookups,
}: {
  log: AuditLogRecord;
  lookups?: AuditValueLookups;
}) {
  if (!log.details) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Riwayat ini tidak merekam detail perubahan.
      </p>
    );
  }

  const details = log.details as Record<string, unknown>;

  if (details.before && details.after) {
    const before = details.before as Record<string, unknown>;
    const after = details.after as Record<string, unknown>;
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

    return (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Sebelum</p>
          {keys.map((key) => (
            <div
              key={key}
              className="flex flex-col gap-0.5 border-b border-border/20 py-1.5 last:border-0"
            >
              <span className="text-xs text-muted-foreground">{getFieldLabel(key)}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {formatValue(key, before[key], lookups)}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Sesudah</p>
          {keys.map((key) => {
            const changed = String(before[key]) !== String(after[key]);

            return (
              <div
                key={key}
                className="flex flex-col gap-0.5 border-b border-border/20 py-1.5 last:border-0"
              >
                <span className="text-xs text-muted-foreground">{getFieldLabel(key)}</span>
                <span className={`text-sm font-medium ${changed ? "text-primary" : "text-foreground"}`}>
                  {formatValue(key, after[key], lookups)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <DetailRows data={details} lookups={lookups} />;
}

function AuditLogEntry({
  log,
  onClick,
}: {
  log: AuditLogRecord;
  onClick: () => void;
}) {
  const config = getActionConfig(log.action);
  const Icon = config.icon;
  const targetName = extractTargetName(log.details);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border/50 bg-card px-4 py-3 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/20"
    >
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-md border px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${config.color}12`,
                color: config.color,
                borderColor: `${config.color}30`,
              }}
            >
              {config.label}
            </span>
            <span className="rounded-md border border-border/50 bg-background px-2 py-1 text-xs text-muted-foreground">
              {getHumanReadableTable(log.targetTable)}
            </span>
          </div>

          <p className="truncate text-sm font-semibold text-foreground">
            {getHumanReadableText(log.action, log.targetTable)}
            {targetName ? ` - ${targetName}` : ""}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {log.user?.name || log.user?.username || "Sistem Otomatis"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {TIMESTAMP_FORMATTER.format(new Date(log.timestamp))}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <span
            className="hidden size-8 items-center justify-center rounded-md text-white sm:inline-flex"
            style={{ backgroundColor: config.color }}
          >
            <Icon className="size-4" />
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}

export default function AuditPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const { data, isLoading, isRefetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useAuditLogs();
  const { data: homebases } = useHomebases();
  const { data: groups } = useGroups();
  const logs = useMemo(
    () => data?.pages.flatMap((page) => page.logs) ?? [],
    [data],
  );

  const detailLookups = useMemo<AuditValueLookups>(
    () => ({
      homebaseId: Object.fromEntries(
        (homebases ?? []).map((homebase) => [homebase.id, homebase.name]),
      ),
      groupId: Object.fromEntries(
        (groups ?? []).map((group) => [group.id, group.name]),
      ),
    }),
    [groups, homebases],
  );

  const selectedActorName =
    selectedLog?.user?.name || selectedLog?.user?.username || "Sistem Otomatis";
  const selectedActivitySummary = selectedLog
    ? `${getHumanReadableText(selectedLog.action, selectedLog.targetTable)} oleh ${selectedActorName}`
    : "";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <AdminPageHeader
        eyebrow="Jejak Aktivitas"
        title="Audit Log"
        description="Tinjau perubahan data penting dan siapa yang menjalankannya."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
            }}
            disabled={isRefetching}
            className="h-10 border-border/50 px-4 text-xs font-medium hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            <RefreshCw className={`mr-2 size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(Object.entries(ACTION_CONFIG) as [
          ActionKey,
          {
            label: string;
            color: string;
            icon: ComponentType<{ className?: string }>;
            description: string;
          },
        ][]).map(([, config]) => (
          <div
            key={config.label}
            className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-background/40 px-2.5 py-1.5"
          >
            <span
              className="flex size-5 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: config.color }}
            >
              <config.icon className="size-3" />
            </span>
            <div className="leading-none">
              <p className="text-xs font-medium text-foreground">{config.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{config.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="space-y-2.5 rounded-xl border border-border/50 bg-card p-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-[74px] w-full rounded-xl bg-muted/20" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <AdminStatePanel icon={ShieldAlert} title="Belum ada aktivitas" />
        ) : (
          <>
            {logs.map((log) => (
              <AuditLogEntry key={log.id} log={log} onClick={() => setSelectedLog(log)} />
            ))}

            {hasNextPage ? (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="h-10 border-border/50 px-5 text-xs font-medium hover:bg-primary/10 hover:text-primary"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 size-3.5 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    <>
                      Muat Lebih Banyak
                      <ChevronRight className="ml-1 size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="border-border/50 bg-card shadow-xl sm:max-w-2xl">
          <DialogHeader className="border-b border-border/30 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileText className="size-4 text-primary" />
              Detail Perubahan
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedActivitySummary}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[65vh] overflow-auto rounded-xl border border-border/40 bg-background/40 p-4">
            {selectedLog ? (
              <AuditDetailBody log={selectedLog} lookups={detailLookups} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
