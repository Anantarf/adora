"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Loader2,
  ChevronRight,
  User,
  Clock,
  Database,
  FileText,
  Trash2,
  Plus,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useAuditLogs, type AuditLogRecord } from "@/hooks/use-audit-log";
import { Button } from "@/components/ui/button";

// ─── Action Config ──────────────────────────────────────
type ActionKey = "CREATE" | "UPDATE" | "DELETE" | "default";

const ACTION_CONFIG: Record<ActionKey, { color: string; icon: typeof Plus; label: string }> = {
  CREATE: { color: "#22C55E", icon: Plus, label: "Tambah" },
  UPDATE: { color: "#3B82F6", icon: Pencil, label: "Ubah" },
  DELETE: { color: "#E11D48", icon: Trash2, label: "Hapus" },
  default: { color: "#8B5CF6", icon: FileText, label: "Aksi" },
};

function getActionConfig(action: string) {
  const key = action.toUpperCase();
  if (key.includes("CREATE") || key.includes("ADD")) return ACTION_CONFIG.CREATE;
  if (key.includes("UPDATE") || key.includes("EDIT") || key.includes("SET")) return ACTION_CONFIG.UPDATE;
  if (key.includes("DELETE") || key.includes("REMOVE")) return ACTION_CONFIG.DELETE;
  return ACTION_CONFIG.default;
}

const TARGET_TABLE_DICT: Record<string, string> = {
  user: "Pengguna",
  parent: "Orang Tua",
  player: "Pemain",
  group: "Kelompok",
  attendance: "Kehadiran",
  statistic: "Statistik",
  evaluationperiod: "Periode Evaluasi",
  auditlog: "Log System",
};

function getHumanReadableTable(table: string): string {
  return TARGET_TABLE_DICT[table.toLowerCase()] || table;
}

function getHumanReadableText(action: string, table: string): string {
  const a = action.toUpperCase();
  const t = getHumanReadableTable(table).toLowerCase();

  if (a.includes("CREATE_STATS")) return `Memasukkan draft ${t} baru`;
  if (a.includes("UPDATE_STATS")) return `Memperbarui & finalisasi ${t}`;
  if (a.includes("SET_ACTIVE")) return `Membuka dan mengaktifkan ${t}`;

  if (a === "CREATE") return `Mendaftarkan ${t} baru`;
  if (a === "UPDATE") return `Memperbarui informasi ${t}`;
  if (a === "DELETE") return `Menghapus ${t} dari sistem`;
  if (a === "RESET_PASSWORD") return `Mereset kata sandi ${t}`;
  if (a === "UPDATE_SELF") return `Memperbarui profil ${t}`;

  return `Melakukan aksi pada ${t}`;
}

// ─── Formatter ──────────────────────────────────────────
const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// ─── Human-Readable Field Labels ─────────────────────────
const FIELD_LABELS: Record<string, string> = {
  username: "Username",
  name: "Nama Lengkap",
  email: "Email",
  role: "Peran",
  groupId: "Kelompok",
  parentId: "Orang Tua",
  dateOfBirth: "Tanggal Lahir",
  homebaseId: "Homebase",
  description: "Keterangan",
  startDate: "Tanggal Mulai",
  endDate: "Tanggal Selesai",
  isActive: "Status Aktif",
  count: "Jumlah Ditambahkan",
  submitted: "Data Dikirim",
  deduped: "Setelah Deduplikasi",
  resetTo: "Sandi Direset Ke",
};

const ROLE_LABELS: Record<string, string> = {
  PARENT: "Orang Tua",
  ADMIN: "Admin",
};

function formatValue(key: string, value: any): string {
  if (value === null || value === undefined) return "—";
  if (key === "role") return ROLE_LABELS[value] ?? value;
  if (key === "resetTo") return value === "default" ? "Sandi awal (adora123)" : "Sandi kustom";
  if (key === "isActive") return value ? "Aktif" : "Tidak aktif";
  if (key.toLowerCase().includes("date") && typeof value === "string") {
    try { return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); } catch { return value; }
  }
  return String(value);
}

function DetailRows({ data }: { data: Record<string, any> }) {
  const rows = Object.entries(data).filter(([k]) => !k.startsWith("_"));
  return (
    <div className="flex flex-col gap-2">
      {rows.map(([key, val]) => (
        <div key={key} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 w-32 shrink-0 pt-0.5">
            {FIELD_LABELS[key] ?? key}
          </span>
          <span className="text-xs font-semibold text-foreground">{formatValue(key, val)}</span>
        </div>
      ))}
    </div>
  );
}

function AuditDetailBody({ log }: { log: AuditLogRecord }) {
  if (!log.details) {
    return (
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center py-6">
        Riwayat ini tidak merekam detail perubahan.
      </p>
    );
  }

  const details = log.details as Record<string, any>;

  // before/after comparison (UPDATE actions)
  if (details.before && details.after) {
    const keys = Array.from(new Set([...Object.keys(details.before), ...Object.keys(details.after)]));
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Sebelum</p>
            {keys.map((k) => (
              <div key={k} className="flex flex-col gap-0.5 py-1.5 border-b border-border/20 last:border-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{FIELD_LABELS[k] ?? k}</span>
                <span className="text-xs font-semibold text-muted-foreground">{formatValue(k, details.before[k])}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-2">Sesudah</p>
            {keys.map((k) => (
              <div key={k} className="flex flex-col gap-0.5 py-1.5 border-b border-border/20 last:border-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{FIELD_LABELS[k] ?? k}</span>
                <span className={`text-xs font-semibold ${String(details.before[k]) !== String(details.after[k]) ? "text-primary" : "text-foreground"}`}>
                  {formatValue(k, details.after[k])}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // flat details (CREATE, DELETE, etc.)
  return <DetailRows data={details} />;
}

// ─── Single Log Entry ───────────────────────────────────
function AuditLogEntry({ log, index, onClick }: { log: AuditLogRecord; index: number; onClick: () => void }) {
  const cfg = getActionConfig(log.action);
  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className="group flex items-start gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:bg-muted/20 cursor-pointer transition-all duration-base animate-card-in"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
    >
      {/* Action Icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center size-10 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110 duration-base mt-0.5"
        style={{
          backgroundColor: cfg.color,
          boxShadow: `0 4px 14px ${cfg.color}44`,
        }}
      >
        <Icon className="size-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
          >
            {cfg.label}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
            <Database className="size-2.5 inline mr-1" />
            {getHumanReadableTable(log.targetTable)}
          </span>
        </div>

        {/* Details */}
        <p className="text-sm font-semibold text-foreground mt-1.5 leading-snug">
          {getHumanReadableText(log.action, log.targetTable)}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <User className="size-2.5" />
            {log.user?.username || log.user?.name || "Sistem Otomatis"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-2.5" />
            {TIMESTAMP_FORMATTER.format(new Date(log.timestamp))}
          </span>
        </div>
      </div>

      <ChevronRight className="size-4 text-border group-hover:text-primary transition-colors duration-base flex-shrink-0 mt-3" />
    </div>
  );
}

// ─── Main Audit Page ────────────────────────────────────
export default function AuditPage() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isLoading, isRefetching, refetch } = useAuditLogs(cursor);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-heading text-4xl text-foreground tracking-widest uppercase">
            Audit Log
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            Rekam jejak aktivitas sistem. Pantau siapa yang mengubah atau menghapus data.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setCursor(undefined); refetch(); }}
          disabled={isRefetching}
          className="h-10 px-4 uppercase font-bold tracking-widest text-[10px] border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
        >
          <RefreshCw className={`mr-2 size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 items-center px-1">
        {(Object.entries(ACTION_CONFIG) as [ActionKey, typeof ACTION_CONFIG[ActionKey]][])
          .filter(([k]) => k !== "default")
          .map(([, cfg]) => (
            <div
              key={cfg.label}
              className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full border border-border shadow-sm"
            >
              <div
                className="p-1 rounded-full text-white shadow-sm"
                style={{ backgroundColor: cfg.color }}
              >
                <cfg.icon className="size-2.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {cfg.label}
              </span>
            </div>
          ))}
      </div>

      {/* Log Entries */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-bold animate-pulse">
              Memuat Rekam Jejak Aktivitas...
            </p>
          </div>
        ) : !data?.logs || data.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-dashed border-border/50 text-center">
            <ShieldAlert className="size-10 text-muted-foreground/30" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Belum ada rekam jejak aktivitas
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Log akan muncul otomatis setelah admin melakukan aksi pada data.
            </p>
          </div>
        ) : (
          <>
            {data.logs.map((log, i) => (
              <AuditLogEntry key={log.id} log={log} index={i} onClick={() => setSelectedLog(log)} />
            ))}

            {/* Pagination */}
            {data.nextCursor && (
               <div className="flex justify-center mt-4">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCursor(data.nextCursor!)}
                   className="h-10 px-6 uppercase font-bold tracking-widest text-[10px] border-border/50 hover:bg-primary/10 hover:text-primary"
                 >
                   Muat Lebih Banyak
                   <ChevronRight className="ml-1 size-3" />
                 </Button>
               </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => (!open ? setSelectedLog(null) : null)}>
        <DialogContent className="sm:max-w-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading uppercase flex items-center gap-2">
              <FileText className="size-5 text-primary" /> Detail Perubahan
            </DialogTitle>
            <DialogDescription className="text-xs font-medium tracking-wide opacity-70">
              Rincian data yang tercatat saat aktivitas ini terjadi.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 rounded-xl p-4 overflow-auto max-h-[60vh] border border-border/50">
            {selectedLog && <AuditDetailBody log={selectedLog} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
