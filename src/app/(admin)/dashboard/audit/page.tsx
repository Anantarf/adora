"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  User,
} from "lucide-react";

import { useAuditLogs, type AuditLogRecord } from "@/hooks/use-audit-log";
import { useHomebases } from "@/hooks/use-homebases";
import { Button } from "@/components/ui/button";
import {
  AUDIT_ACTION_CONFIG as ACTION_CONFIG,
  getAuditActionConfig as getActionConfig,
  type AuditActionKey as ActionKey,
} from "@/lib/constants/badge-configs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
          <span className="text-micro w-32 shrink-0 pt-0.5 text-muted-foreground/75">
            {getFieldLabel(key)}
          </span>
          <span className="text-xs font-semibold text-foreground">
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
      <p className="py-6 text-center text-micro text-muted-foreground/75">
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
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
          <p className="mb-2 text-micro font-bold uppercase tracking-widest text-muted-foreground/75">
            Sebelum
          </p>
          {keys.map((key) => (
            <div
              key={key}
              className="flex flex-col gap-0.5 border-b border-border/20 py-1.5 last:border-0"
            >
              <span className="text-micro text-muted-foreground/60">
                {getFieldLabel(key)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {formatValue(key, before[key], lookups)}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-inner">
          <p className="mb-2 text-micro font-bold uppercase tracking-widest text-primary/70">
            Sesudah
          </p>
          {keys.map((key) => {
            const changed = String(before[key]) !== String(after[key]);

            return (
              <div
                key={key}
                className="flex flex-col gap-0.5 border-b border-border/20 py-1.5 last:border-0"
              >
                <span className="text-micro text-muted-foreground/60">
                  {getFieldLabel(key)}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    changed ? "text-primary" : "text-foreground"
                  }`}
                >
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
  index,
  onClick,
}: {
  log: AuditLogRecord;
  index: number;
  onClick: () => void;
}) {
  const config = getActionConfig(log.action);
  const Icon = config.icon;
  const targetName = extractTargetName(log.details);

  return (
    <div
      onClick={onClick}
      className="group animate-card-in flex cursor-pointer items-start gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/20"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
    >
      <div
        className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundColor: config.color,
          boxShadow: `0 4px 14px ${config.color}44`,
        }}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-micro font-bold tracking-tight"
            style={{ backgroundColor: `${config.color}18`, color: config.color }}
          >
            {config.label}
          </span>
          <span className="rounded-full border border-border/50 bg-muted px-2 py-0.5 text-micro font-medium text-muted-foreground">
            {getHumanReadableTable(log.targetTable)}
          </span>
        </div>

        <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">
          {getHumanReadableText(log.action, log.targetTable)}
          {targetName ? <span className="font-bold text-primary"> - {targetName}</span> : null}
        </p>

        <div className="mt-2 flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="size-2.5" />
            {log.user?.name || log.user?.username || "Sistem Otomatis"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-2.5" />
            {TIMESTAMP_FORMATTER.format(new Date(log.timestamp))}
          </span>
        </div>
      </div>

      <ChevronRight className="mt-3 size-4 shrink-0 text-border transition-colors duration-300 group-hover:text-primary" />
    </div>
  );
}

export default function AuditPage() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const { data, isLoading, isRefetching, refetch } = useAuditLogs(cursor);
  const { data: homebases } = useHomebases();

  const detailLookups = useMemo<AuditValueLookups>(
    () => ({
      homebaseId: Object.fromEntries(
        (homebases ?? []).map((homebase) => [homebase.id, homebase.name]),
      ),
    }),
    [homebases],
  );

  const handleRefresh = () => {
    setCursor(undefined);
    refetch();
  };

  const selectedActorName =
    selectedLog?.user?.name || selectedLog?.user?.username || "Sistem Otomatis";
  const selectedActivitySummary = selectedLog
    ? `${getHumanReadableText(selectedLog.action, selectedLog.targetTable)} oleh ${selectedActorName}`
    : "";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-6 md:gap-6 md:pb-8 sm:flex-row sm:items-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          Rekam jejak setiap perubahan data untuk transparansi sistem.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefetching}
          className="h-10 border-border/50 px-4 text-[10px] font-bold uppercase tracking-widest hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
        >
          <RefreshCw className={`mr-2 size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1">
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
            className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 py-1.5 pl-2 pr-3"
          >
            <div className="rounded-full p-1 text-white" style={{ backgroundColor: config.color }}>
              <config.icon className="size-2.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                {config.label}
              </span>
              <span className="mt-0.5 text-[9px] text-muted-foreground">
                {config.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="animate-pulse text-sm font-bold tracking-wide text-muted-foreground">
              Memuat riwayat aktivitas...
            </p>
          </div>
        ) : !data?.logs || data.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-muted/10 py-20 text-center">
            <ShieldAlert className="size-10 text-muted-foreground/20" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Belum ada aktivitas
            </p>
          </div>
        ) : (
          <>
            {data.logs.map((log, index) => (
              <AuditLogEntry
                key={log.id}
                log={log}
                index={index}
                onClick={() => setSelectedLog(log)}
              />
            ))}

            {data.nextCursor ? (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCursor(data.nextCursor!)}
                  className="h-11 border-border/50 px-8 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary"
                >
                  Muat Lebih Banyak
                  <ChevronRight className="ml-1 size-3" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="border-border/60 bg-card shadow-2xl sm:max-w-2xl">
          <DialogHeader className="border-b border-border/30 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-heading uppercase">
              <FileText className="size-5 text-primary" />
              Detail Perubahan
            </DialogTitle>
            <DialogDescription className="text-xs font-medium tracking-wide opacity-70">
              {selectedActivitySummary}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[65vh] overflow-auto rounded-2xl border border-border/40 bg-muted/20 p-5 shadow-inner">
            {selectedLog ? (
              <AuditDetailBody log={selectedLog} lookups={detailLookups} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
