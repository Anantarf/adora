"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { AlertCircle, HeartPulse, RefreshCcw, School, Users, Search, LayoutGrid, Table as TableIcon } from "lucide-react";

import { useCoachWorkspace } from "@/hooks/use-coach-workspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

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
      <div className="grid gap-6">
        <div className="h-24 animate-pulse rounded-2xl border border-border/50 bg-card/70" />
        <div className="h-16 animate-pulse rounded-2xl border border-border/50 bg-card/70" />
        <div className="h-96 animate-pulse rounded-2xl border border-border/50 bg-card/70" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Data pemain coach gagal dimuat</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Terjadi kendala saat memuat daftar pemain."}
          </p>
        </div>
        <Button type="button" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 size-4" />
          Muat Ulang
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-5 md:flex-row md:items-end md:pb-6">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Pemain Saya
          </p>
          <h1 className="font-heading text-2xl tracking-[0.08em] text-foreground md:text-[2rem]">
            Daftar Pemain Berdasarkan Assignment
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Area ini menampilkan pemain yang saat ini terhubung ke kelompok tanggung jawab coach Anda. Belum ada kontrol edit agar regulasi data tetap jelas.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground md:text-sm">
          <Users className="size-4 text-primary" />
          {data.players.length} pemain aktif
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
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
        
        <div className="flex w-full sm:w-auto items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <TableIcon className="size-4" />
            <span className="inline">List</span>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <LayoutGrid className="size-4" />
            <span className="inline">Grid</span>
          </button>
        </div>
      </div>

      <Card className="border border-border/50 shadow-sm bg-transparent sm:bg-card">
        <CardHeader className="border-b border-border/40 bg-card rounded-t-xl hidden sm:block">
          <CardTitle>Roster Coach</CardTitle>
          <CardDescription>Daftar pemain yang sesuai dengan filter pencarian dan kelompok.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-0 sm:p-6 sm:pt-6">
          {filteredPlayers.length > 0 ? (
            viewMode === "list" ? (
              <div className="space-y-3">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="grid gap-3 rounded-2xl border border-border/50 bg-card sm:bg-background/40 p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(10rem,0.7fr)_minmax(12rem,0.8fr)] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{player.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {player.group.name} | Lahir {formatBirthDate(player.dateOfBirth)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <School className="size-3.5 text-primary" />
                        <span className="truncate">{player.schoolOrigin || "Sekolah belum diisi"}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Homebase: {player.homebase?.name || "Belum ditetapkan"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        Orang tua: <span className="text-muted-foreground">{player.parentName || "Belum ditautkan"}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <HeartPulse className="size-3.5 text-primary" />
                        <span>{player.gender || "Gender belum diisi"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPlayers.map((player) => (
                  <div key={player.id} className="flex flex-col rounded-2xl border border-border/50 bg-card shadow-sm p-4 hover:border-primary/30 transition-colors">
                    <div className="flex-1 min-w-0 mb-4">
                      <p className="text-sm font-semibold text-foreground line-clamp-1" title={player.name}>{player.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{player.group.name}</p>
                    </div>
                    <div className="space-y-2 mt-auto text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground bg-muted/20 p-2 rounded-lg">
                        <School className="size-3.5 shrink-0 text-primary" />
                        <span className="truncate" title={player.schoolOrigin || "Sekolah belum diisi"}>
                          {player.schoolOrigin || "Sekolah belum diisi"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground bg-muted/20 p-2 rounded-lg">
                        <span className="font-medium text-foreground truncate max-w-[120px]" title={player.parentName || "Belum ditautkan"}>
                          {player.parentName || "Tidak ditautkan"}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <HeartPulse className="size-3.5 text-primary" />
                          <span>{player.gender ? player.gender.substring(0,1).toUpperCase() : "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center border border-dashed border-border/60 rounded-2xl bg-card">
              <Users className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-semibold text-foreground">
                Tidak ada pemain ditemukan
              </p>
              <p className="text-xs text-muted-foreground max-w-[250px]">
                {searchQuery || selectedGroupId !== "all" 
                  ? "Coba ubah filter pencarian atau kelompok untuk melihat hasil."
                  : "Belum ada pemain aktif yang terhubung ke assignment coach ini."}
              </p>
              {(searchQuery || selectedGroupId !== "all") && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 h-8 text-xs rounded-xl"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedGroupId("all");
                  }}
                >
                  Reset Filter
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
