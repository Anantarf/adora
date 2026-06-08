"use client";

import { AlertCircle, CalendarDays, FileCheck2, RefreshCcw, Users, UsersRound } from "lucide-react";

import { useCoachWorkspace } from "@/hooks/use-coach-workspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CoachDashboardPageClient() {
  const { data, isLoading, isError, error, refetch } = useCoachWorkspace();

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl border border-border/50 bg-card/70" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="h-80 animate-pulse rounded-2xl border border-border/50 bg-card/70" />
          <div className="h-80 animate-pulse rounded-2xl border border-border/50 bg-card/70" />
        </div>
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
          <h2 className="text-lg font-semibold text-foreground">Workspace coach gagal dimuat</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Terjadi kendala saat memuat data coach."}
          </p>
        </div>
        <Button type="button" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 size-4" />
          Muat Ulang
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Kelompok Aktif",
      value: data.summary.totalGroups,
      helper: "Assignment group yang saat ini Anda pegang",
      icon: UsersRound,
    },
    {
      label: "Pemain Dipantau",
      value: data.summary.totalPlayers,
      helper: "Total pemain dari semua assignment aktif",
      icon: Users,
    },
    {
      label: "Agenda Terdekat",
      value: data.summary.upcomingEventsCount,
      helper: "Agenda mendatang yang melibatkan kelompok Anda",
      icon: CalendarDays,
    },
    {
      label: "Nilai Terbit",
      value: data.summary.recentPublishedStatsCount,
      helper: "Total statistik published dari kelompok Anda",
      icon: FileCheck2,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-5 md:flex-row md:items-end md:pb-6">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Dashboard Coach
          </p>
          <h1 className="font-heading text-2xl tracking-[0.08em] text-foreground md:text-[2rem]">
            Ringkasan Kelompok dan Pemain
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Pantau assignment aktif, pemain yang Anda dampingi, dan agenda terdekat tanpa bercampur dengan area admin.
          </p>
        </div>
        <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground md:text-sm">
          Coach: <span className="font-semibold text-foreground">{data.coach.name}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardDescription className="text-[11px] uppercase tracking-[0.18em]">
                    {card.label}
                  </CardDescription>
                  <CardTitle className="mt-2 text-3xl font-semibold text-foreground">
                    {card.value}
                  </CardTitle>
                </div>
                <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary">
                  <card.icon className="size-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/40">
            <CardTitle>Kelompok Tanggung Jawab</CardTitle>
            <CardDescription>Daftar kelompok yang terhubung ke akun coach Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.groups.length > 0 ? (
              data.groups.map((group) => (
                <div
                  key={group.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/40 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{group.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {group.homebase?.name || "Tanpa homebase"} | {group.category === "KELOMPOK_UMUR" ? "Kelompok umur" : "Sekolah"}
                    </p>
                  </div>
                  <div className="inline-flex w-fit rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                    {group._count.player} pemain aktif
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada kelompok yang di-assign admin ke coach ini.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/40">
            <CardTitle>Agenda Terdekat</CardTitle>
            <CardDescription>Agenda latihan atau kegiatan yang terkait dengan kelompok Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingEvents.length > 0 ? (
              data.upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{event.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(event.date)}{event.location ? ` | ${event.location}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {event.type}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Kelompok: {event.groups.map((group) => group.name).join(", ")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada agenda mendatang untuk assignment coach ini.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
