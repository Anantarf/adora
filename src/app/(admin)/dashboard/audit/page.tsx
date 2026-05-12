"use client";

import { useState } from "react";
import { ShieldAlert, Loader2, ChevronRight, User, Clock, FileText, RefreshCw } from "lucide-react";
import { useAuditLogs, type AuditLogRecord } from "@/hooks/use-audit-log";
import { Button } from "@/components/ui/button";
import { AUDIT_ACTION_CONFIG as ACTION_CONFIG, getAuditActionConfig as getActionConfig, type AuditActionKey as ActionKey } from "@/lib/constants/badge-configs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Utilities
import { 
  getHumanReadableTable, 
  getHumanReadableText, 
  extractTargetName, 
  formatValue, 
  TIMESTAMP_FORMATTER,
  FIELD_LABELS 
} from "@/lib/utils/audit-log";

// ─── SUB-COMPONENTS ─────────────────────────────────────

/**
 * Renders key-value pairs of details
 */
function DetailRows({ data }: { data: Record<string, unknown> }) {
  const rows = Object.entries(data).filter(([k]) => !k.startsWith("_"));
  return (
    <div className="flex flex-col gap-2">
      {rows.map(([key, val]) => (
        <div key={key} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
          <span className="text-micro text-muted-foreground/75 w-32 shrink-0 pt-0.5">{FIELD_LABELS[key] ?? key}</span>
          <span className="text-xs font-semibold text-foreground">{formatValue(key, val)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Handles complex before/after diffing view
 */
function AuditDetailBody({ log }: { log: AuditLogRecord }) {
  if (!log.details) {
    return <p className="text-micro text-muted-foreground/75 text-center py-6">Riwayat ini tidak merekam detail perubahan.</p>;
  }

  const details = log.details as Record<string, unknown>;

  // Comparison View for Updates
  if (details.before && details.after) {
    const before = details.before as Record<string, unknown>;
    const after = details.after as Record<string, unknown>;
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

    return (
      <div className="grid grid-cols-2 gap-3">
        {/* BEFORE */}
        <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
          <p className="text-micro text-muted-foreground/75 mb-2 font-bold uppercase tracking-widest">Sebelum</p>
          {keys.map((k) => (
            <div key={k} className="flex flex-col gap-0.5 py-1.5 border-b border-border/20 last:border-0">
              <span className="text-micro text-muted-foreground/60">{FIELD_LABELS[k] ?? k}</span>
              <span className="text-xs font-semibold text-muted-foreground">{formatValue(k, before[k])}</span>
            </div>
          ))}
        </div>
        {/* AFTER */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-inner">
          <p className="text-micro text-primary/70 mb-2 font-bold uppercase tracking-widest">Sesudah</p>
          {keys.map((k) => (
            <div key={k} className="flex flex-col gap-0.5 py-1.5 border-b border-border/20 last:border-0">
              <span className="text-micro text-muted-foreground/60">{FIELD_LABELS[k] ?? k}</span>
              <span className={`text-xs font-semibold ${String(before[k]) !== String(after[k]) ? "text-primary" : "text-foreground"}`}>
                {formatValue(k, after[k])}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <DetailRows data={details} />;
}

/**
 * Single Entry Component with premium hover effects
 */
function AuditLogEntry({ log, index, onClick }: { log: AuditLogRecord; index: number; onClick: () => void }) {
  const cfg = getActionConfig(log.action);
  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className="group flex items-start gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:bg-muted/20 cursor-pointer transition-all duration-300 animate-card-in"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center size-10 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 duration-300 mt-0.5"
        style={{ backgroundColor: cfg.color, boxShadow: `0 4px 14px ${cfg.color}44` }}
      >
        <Icon className="size-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-micro px-2 py-0.5 rounded-full font-bold tracking-tight" style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}>
            {cfg.label}
          </span>
          <span className="text-micro px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50 font-medium">
            {getHumanReadableTable(log.targetTable)}
          </span>
        </div>

        <p className="text-sm font-semibold text-foreground mt-1.5 leading-snug">
          {getHumanReadableText(log.action, log.targetTable)}
          {extractTargetName(log.details) && <span className="text-primary font-bold"> — {extractTargetName(log.details)}</span>}
        </p>

        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-medium">
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

      <ChevronRight className="size-4 text-border group-hover:text-primary transition-colors duration-300 flex-shrink-0 mt-3" />
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────

export default function AuditPage() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isLoading, isRefetching, refetch } = useAuditLogs(cursor);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const handleRefresh = () => {
    setCursor(undefined);
    refetch();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl text-foreground tracking-widest uppercase">Riwayat Aktivitas</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">Rekam jejak setiap perubahan data untuk transparansi sistem.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefetching}
          className="h-10 px-4 uppercase font-bold tracking-widest text-[10px] border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
        >
          <RefreshCw className={`mr-2 size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Legend / Filters Placeholder */}
      <div className="flex flex-wrap gap-2 items-center px-1">
        {(Object.entries(ACTION_CONFIG) as [ActionKey, any][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-2 bg-muted/40 pl-2 pr-3 py-1.5 rounded-full border border-border/60">
            <div className="p-1 rounded-full text-white" style={{ backgroundColor: cfg.color }}>
              <cfg.icon className="size-2.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">{cfg.label}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">{cfg.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-bold tracking-widest animate-pulse">MEMUAT REKAM JEJAK...</p>
          </div>
        ) : !data?.logs || data.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-dashed border-border/50 text-center bg-muted/10">
            <ShieldAlert className="size-10 text-muted-foreground/20" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Belum ada aktivitas</p>
          </div>
        ) : (
          <>
            {data.logs.map((log, i) => (
              <AuditLogEntry key={log.id} log={log} index={i} onClick={() => setSelectedLog(log)} />
            ))}

            {data.nextCursor && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" size="sm" onClick={() => setCursor(data.nextCursor!)} className="h-11 px-8 uppercase font-bold tracking-widest text-[10px] border-border/50 hover:bg-primary/10 hover:text-primary">
                  Muat Lebih Banyak
                  <ChevronRight className="ml-1 size-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl bg-card border-border/60 shadow-2xl">
          <DialogHeader className="border-b border-border/30 pb-4">
            <DialogTitle className="text-xl font-heading uppercase flex items-center gap-2">
              <FileText className="size-5 text-primary" /> Detail Perubahan
            </DialogTitle>
            <DialogDescription className="text-xs font-medium tracking-wide opacity-70">Log ID: {selectedLog?.id}</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/20 rounded-2xl p-5 overflow-auto max-h-[65vh] border border-border/40 mt-4 shadow-inner">
            {selectedLog && <AuditDetailBody log={selectedLog} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
