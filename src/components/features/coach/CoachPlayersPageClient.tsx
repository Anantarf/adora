"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useDebounce } from "use-debounce";
import { AlertCircle, ClipboardCheck, FilePenLine, HeartPulse, RefreshCcw, School, Search, Users } from "lucide-react";

import { useCoachWorkspace } from "@/hooks/use-coach-workspace";
import { AdminPageHeader } from "@/components/features/admin-page-header";
import { AdminStatePanel } from "@/components/features/admin-state-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function formatBirthDate(value: Date | string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CoachPlayersPageClient() {
  const { data, isLoading, isError, error, refetch } = useCoachWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");

  const filteredPlayers = useMemo(() => {
    if (!data?.players) return [];

    let result = data.players;

    if (selectedGroupId !== "all") {
      result = result.filter(p => p.group.id === selectedGroupId);
    }

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase().trim();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    return result;
  }, [data, selectedGroupId, debouncedSearch]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
        <div className="flex min-h-[300px] w-full flex-col gap-2 rounded-xl border border-border/50 bg-card p-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-full rounded-xl bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <AdminStatePanel
        icon={AlertCircle}
        title="Data pemain gagal dimuat"
        description={error instanceof Error ? error.message : "Terjadi kendala saat memuat daftar pemain."}
        tone="danger"
        action={
          <Button type="button" onClick={() => refetch()}>
            <RefreshCcw className="mr-2 size-4" />
            Muat Ulang
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <AdminPageHeader
        eyebrow="Portal Pelatih"
        title="Pemain Saya"
        description="Area ini menampilkan pemain yang saat ini terhubung ke kelompok tanggung jawab Anda. Perubahan data pemain tetap dikelola admin."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border border-border/50 bg-background/60 px-3 py-1.5 font-medium flex items-center gap-2">
            <Users className="size-3.5" />
            {data.players.length} pemain aktif
          </span>
          </div>
        }
      />

      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama pemain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-background/50 border-border/50 rounded-xl focus-visible:ring-primary/30"
            />
          </div>
          <Select value={selectedGroupId} onValueChange={(value) => setSelectedGroupId(value ?? "all")}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 bg-background/50 border-border/50 rounded-xl focus-visible:ring-primary/30">
              <SelectValue placeholder="Semua Kelompok" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50">
              <SelectItem value="all">Semua Kelompok Saya</SelectItem>
              {data.groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border border-border/50 bg-transparent shadow-sm sm:bg-card">
        <CardHeader className="border-b border-border/40 bg-card rounded-t-xl hidden sm:block">
          <CardTitle>Daftar Pemain</CardTitle>
          <CardDescription>Gunakan aksi cepat untuk presensi atau penilaian pemain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-0 sm:p-6 sm:pt-6">
          {filteredPlayers.length > 0 ? (
            <div className="space-y-3">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="group grid gap-3 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/20 sm:bg-background/40 lg:grid-cols-[minmax(0,1.1fr)_minmax(10rem,0.7fr)_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{player.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {player.group.name} | Lahir {formatBirthDate(player.dateOfBirth)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground lg:hidden">
                      <span>{player.schoolOrigin || "Sekolah belum diisi"}</span>
                      <span>•</span>
                      <span>{player.parentName || "Orang tua belum terhubung"}</span>
                    </div>
                  </div>
                  <div className="hidden min-w-0 lg:block">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <School className="size-3.5 text-primary/70" />
                      <span className="truncate">{player.schoolOrigin || "Sekolah belum diisi"}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <HeartPulse className="size-3.5 text-primary/70" />
                      <span>{player.gender || "Jenis kelamin belum diisi"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={`/coach/attendances?q=${encodeURIComponent(player.group.name)}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 rounded-lg text-xs font-medium group/btn transition-all hover:bg-primary/5 hover:border-primary/30")}
                    >
                        <ClipboardCheck className="mr-2 size-3.5 transition-transform group-hover/btn:scale-110" />
                        Presensi
                    </Link>
                    <Link
                      href={`/coach/statistics?groupId=${player.group.id}`}
                      className={cn(buttonVariants({ size: "sm" }), "h-9 rounded-lg text-xs font-medium group/btn transition-all hover:brightness-105")}
                    >
                        <FilePenLine className="mr-2 size-3.5 transition-transform group-hover/btn:rotate-6" />
                        Nilai
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminStatePanel
              icon={Users}
              title="Pemain tidak ditemukan"
              description={searchQuery || selectedGroupId !== "all"
                ? "Coba ubah filter pencarian atau kelompok untuk melihat hasil."
                : "Belum ada pemain aktif yang terhubung ke penugasan pelatih ini."}
              action={
                searchQuery || selectedGroupId !== "all" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-lg text-xs font-medium"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedGroupId("all");
                    }}
                  >
                    Bersihkan Filter
                  </Button>
                ) : null
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
