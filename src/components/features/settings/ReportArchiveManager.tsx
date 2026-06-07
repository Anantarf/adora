"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useGroups } from "@/hooks/use-groups";
import { useActivePeriod, usePeriods } from "@/hooks/use-evaluation-periods";
import {
  useReleaseReportArchive,
  useReportArchiveRows,
  useUpsertReportArchiveDraft,
} from "@/hooks/use-report-archives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toUserErrorMessage } from "@/lib/utils";

async function uploadArchive(file: File, assetKey: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("assetKey", assetKey);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Upload gagal.");
  }

  return payload.url as string;
}

export function ReportArchiveManager() {
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [uploadingPlayerId, setUploadingPlayerId] = useState<string | null>(null);
  const [releasingArchiveId, setReleasingArchiveId] = useState<string | null>(null);

  const { data: groups } = useGroups();
  const { data: periods } = usePeriods();
  const { data: activePeriod } = useActivePeriod();
  const { data: rows, isLoading } = useReportArchiveRows(selectedGroupId || null, selectedPeriodId || null);
  const { mutateAsync: saveDraft } = useUpsertReportArchiveDraft();
  const { mutateAsync: releaseArchive } = useReleaseReportArchive();

  useEffect(() => {
    if (!selectedGroupId && groups?.length) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (selectedPeriodId || !periods?.length) {
      return;
    }

    setSelectedPeriodId(activePeriod?.id ?? periods[0].id);
  }, [activePeriod?.id, periods, selectedPeriodId]);

  const selectedGroupName = useMemo(
    () => groups?.find((group) => group.id === selectedGroupId)?.name ?? "Kelompok",
    [groups, selectedGroupId],
  );

  const selectedPeriodName = useMemo(
    () => periods?.find((period) => period.id === selectedPeriodId)?.name ?? "Periode",
    [periods, selectedPeriodId],
  );

  const getArchiveStatusLabel = (
    status: "RELEASED" | "DRAFT" | undefined,
    hasFile: boolean,
  ) => {
    if (status === "RELEASED") {
      return "Dirilis";
    }

    return hasFile ? "Draf" : "Belum upload";
  };

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="text-sm font-semibold text-foreground">
          Arsip Rapor Orang Tua
        </CardTitle>
        <CardDescription className="text-sm">
          Upload rapor per pemain dari konteks kelompok latihan, lalu rilis saat siap dilihat orang tua.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-medium text-muted-foreground">Kelompok Latihan</label>
            <Select value={selectedGroupId} onValueChange={(value) => setSelectedGroupId(value ?? "")}>
              <SelectTrigger className="h-11 w-full border-border/50 bg-background/50">
                <SelectValue placeholder="Pilih kelompok">{selectedGroupName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(groups ?? []).map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-medium text-muted-foreground">Periode</label>
            <Select value={selectedPeriodId} onValueChange={(value) => setSelectedPeriodId(value ?? "")}>
              <SelectTrigger className="h-11 w-full border-border/50 bg-background/50">
                <SelectValue placeholder="Pilih periode">{selectedPeriodName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(periods ?? []).map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/30 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Memuat daftar pemain dan arsip rapor...
          </div>
        ) : !rows?.length ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-background/30 py-10 text-center text-sm text-muted-foreground">
            Belum ada pemain pada kombinasi kelompok dan periode ini.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const isUploading = uploadingPlayerId === row.playerId;
              const isReleasing = releasingArchiveId === row.archiveId;
              const isReleased = row.status === "RELEASED";

              return (
                <div
                  key={row.playerId}
                  className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/30 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{row.playerName}</p>
                      <p className="text-xs text-muted-foreground">
                        Status arsip: {getArchiveStatusLabel(row.status, Boolean(row.fileUrl))}
                      </p>
                    </div>
                    {row.fileUrl ? (
                      <a
                        href={row.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Lihat file saat ini
                      </a>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <label className="flex h-10 cursor-pointer items-center justify-between rounded-lg border border-dashed border-border/50 bg-card px-3 transition-colors hover:border-primary/30 hover:bg-primary/5 md:flex-1">
                      <div className="flex items-center gap-2">
                        {isUploading ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <FileUp className="size-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {row.fileUrl ? "Ganti file rapor" : "Upload file rapor"}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-primary">Pilih File</span>
                      <input
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file || !selectedPeriodId) {
                            return;
                          }

                          setUploadingPlayerId(row.playerId);
                          try {
                            const fileUrl = await uploadArchive(
                              file,
                              `report_archive_${row.playerId}_${selectedPeriodId}_${Date.now()}`,
                            );
                            await saveDraft({
                              playerId: row.playerId,
                              periodId: selectedPeriodId,
                              fileUrl,
                            });
                          } catch (error) {
                            toast.error(toUserErrorMessage(error, "Gagal mengunggah rapor."));
                          } finally {
                            setUploadingPlayerId(null);
                            event.target.value = "";
                          }
                        }}
                      />
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      disabled={!row.archiveId || !row.fileUrl || isUploading || isReleasing || isReleased}
                      onClick={async () => {
                        if (!row.archiveId) {
                          return;
                        }

                        setReleasingArchiveId(row.archiveId);
                        try {
                          await releaseArchive(row.archiveId);
                        } finally {
                          setReleasingArchiveId(null);
                        }
                      }}
                    >
                      {isReleasing ? (
                        <>
                          <Loader2 className="mr-2 size-3.5 animate-spin" />
                          Merilis...
                        </>
                      ) : isReleased ? (
                        <>
                          <CheckCircle2 className="mr-2 size-3.5" />
                          Sudah Dirilis
                        </>
                      ) : (
                        "Rilis ke Parent"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
