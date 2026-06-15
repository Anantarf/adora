"use client";

import Link from "next/link";
import { AlertCircle, CalendarDays, ClipboardCheck, FileCheck2, RefreshCcw, Users, UsersRound } from "lucide-react";

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
          <h2 className="text-lg font-semibold text-foreground">Portal coach gagal dimuat</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Terjadi kendala saat memuat data pelatih."}
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
      helper: "Kelompok latihan yang saat ini Anda pegang",
      icon: UsersRound,
    },
    {
      label: "Pemain Dipantau",
      value: data.summary.totalPlayers,
      helper: "Total pemain dari semua penugasan aktif",
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
      helper: "Total statistik yang sudah diterbitkan dari kelompok Anda",
      icon: FileCheck2,
    },
  ];

  const quickActions = [
    {
      title: "Isi Presensi",
      description: "Catat kehadiran setelah latihan selesai.",
      href: "/coach/attendances",
      icon: ClipboardCheck,
    },
    {
      title: "Input Nilai",
      description: "Simpan penilaian pemain sebagai draf.",
      href: "/coach/statistics",
      icon: FileCheck2,
    },
    {
      title: "Cek Pemain",
      description: "Lihat daftar pemain di kelompok Anda.",
      href: "/coach/players",
      icon: Users,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-10 md:gap-6">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)] lg:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Dashboard Utama
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="max-w-full text-balance break-words font-heading text-2xl leading-tight tracking-[0.03em] text-foreground sm:text-[1.9rem] md:text-[2.15rem] lg:tracking-[0.06em] xl:text-[2.35rem]">
                Ringkasan Kelompok dan Pemain
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Pantau penugasan aktif, pemain yang Anda dampingi, dan agenda terdekat tanpa bercampur dengan area admin.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-primary sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">Portal Coach</p>
              <p className="mt-2 text-sm font-bold text-foreground">Akses pelatih aktif</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Anda masuk sebagai Coach <span className="font-semibold text-foreground">{data.coach.name}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/45 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Kelompok</p>
              <p className="mt-2 font-heading text-2xl leading-none text-foreground">{data.summary.totalGroups}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/45 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pemain</p>
              <p className="mt-2 font-heading text-2xl leading-none text-primary">{data.summary.totalPlayers}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-border/50 bg-background/35 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center md:px-6">
          <span className="text-xs font-medium text-muted-foreground">{formatDate(new Date())}</span>
          <Link
            href="/coach/attendances"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <ClipboardCheck className="size-4" />
            Isi Presensi
          </Link>
        </div>
      </section>

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

      <Card className="border border-border/50 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle>Mulai dari sini</CardTitle>
          <CardDescription>Aksi utama yang paling sering dipakai pelatih.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-2xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary">
                <action.icon className="size-4" />
              </div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">{action.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

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
              <p className="text-sm text-muted-foreground">Belum ada kelompok yang ditugaskan admin ke coach ini.</p>
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
              <p className="text-sm text-muted-foreground">Belum ada agenda mendatang untuk penugasan coach ini.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
