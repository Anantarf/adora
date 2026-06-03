"use client";

import { KeyRound, Link2, Mail, PencilLine, Shield, Trash2, UserCircle2, UserRoundCog, Users } from "lucide-react";
import type { getUsersAction } from "@/actions/users";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<string, string> = {
  PARENT: "Orang Tua",
  ADMIN: "Admin",
  COACH: "Coach",
};

type UserItem = Awaited<ReturnType<typeof getUsersAction>>[number];

type AccountDetailDialogProps = {
  user: UserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  onManagePlayers: (id: string) => void;
  onManageCoachProfile: (id: string) => void;
};

function DetailRow({
  label,
  value,
  valueClassName = "font-semibold text-foreground",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="grid gap-1 border-b border-border/40 py-3 last:border-b-0 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`min-w-0 text-sm ${valueClassName}`}>{value}</span>
    </div>
  );
}

export function AccountDetailDialog({
  user,
  open,
  onOpenChange,
  onEdit,
  onReset,
  onDelete,
  onManagePlayers,
  onManageCoachProfile,
}: AccountDetailDialogProps) {
  if (!user) return null;

  const isParent = user.role === "PARENT";
  const isCoach = user.role === "COACH";
  const username = user.username ?? "-";
  const isProtected = username === "superadmin";
  const displayName = user.name ?? username;
  const playerCount = user._count.player;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl border-border/50 bg-card p-0 text-foreground">
        <DialogHeader className="border-b border-border/50 px-6 pt-6 pb-5">
          <DialogTitle className="text-lg font-semibold text-foreground">Detail Akun</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Lihat ringkasan akun dan jalankan aksi sensitif dari satu tempat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[82vh] flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 pr-3 custom-scrollbar">
            <div className="flex items-start gap-4 border-b border-border/40 pb-5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted">
                <UserCircle2 className="size-7 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{displayName}</h3>
                  <span className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                  {isProtected && (
                    <span className="rounded border border-border/60 bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      Sistem Bawaan
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">@{username}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    <span>{user.email || "Email belum diisi"}</span>
                  </div>
                  {isParent && (
                    <span className="rounded-md border border-border/50 bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {playerCount} pemain tertaut
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-semibold text-foreground">Informasi Akun</h4>
              <div className="mt-3 px-1">
                <DetailRow label="Nama Akun" value={displayName} />
                <DetailRow label="Username" value={`@${username}`} valueClassName="font-medium text-muted-foreground" />
                <DetailRow label="Peran" value={ROLE_LABELS[user.role] ?? user.role} />
                <DetailRow
                  label="Email"
                  value={user.email || "-"}
                  valueClassName={user.email ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}
                />
              </div>
            </div>

            <div className={`mt-5 grid gap-5 ${(isParent || isCoach) ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
              {isParent && (
                <div className="border-t border-border/40 pt-5 lg:pt-0 lg:border-t-0 lg:border-l lg:border-border/40 lg:pl-5 lg:order-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground">Pemain Tertaut</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Kelola daftar anak yang memakai akun orang tua ini untuk akses portal.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      {playerCount} pemain
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg border border-border/50 px-3 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background">
                        <Users className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Kelola pemain tertaut</p>
                        <p className="mt-1 text-xs text-muted-foreground">Lihat, tambahkan, atau lepas tautan pemain dari akun ini.</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 h-9 w-full rounded-lg border-border/50 px-3 text-xs font-medium"
                      onClick={() => onManagePlayers(user.id)}
                    >
                      <Link2 className="mr-1.5 size-3.5" />
                      Kelola
                    </Button>
                  </div>
                </div>
              )}

              {isCoach && (
                <div className="border-t border-border/40 pt-5 lg:order-2 lg:border-t-0 lg:border-l lg:border-border/40 lg:pl-5 lg:pt-0">
                  <div className="rounded-lg border border-border/50 px-3 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background">
                        <UserRoundCog className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Profil Coach</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Lengkapi biodata, lisensi, foto, dan assignment kelompok latihan coach ini.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 h-9 w-full rounded-lg border-border/50 px-3 text-xs font-medium"
                      onClick={() => onManageCoachProfile(user.id)}
                    >
                      <UserRoundCog className="mr-1.5 size-3.5" />
                      Kelola Profil Coach
                    </Button>
                  </div>
                </div>
              )}

              <div className={(isParent || isCoach) ? "lg:order-1" : ""}>
                <div className={`${(isParent || isCoach) ? "" : "border-t border-border/40 pt-5"}`}>
                  <h4 className="text-sm font-semibold text-foreground">Aksi Akun</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Jalankan perubahan sensitif dari sini agar daftar akun tetap ringkas.
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    {!isProtected ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(user.id)}
                          className="flex items-start gap-3 rounded-lg border border-border/50 px-3 py-3 text-left transition-colors hover:bg-muted/20"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background">
                            <PencilLine className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">Edit akun</p>
                            <p className="text-xs text-muted-foreground">Perbarui nama, username, dan email akun ini.</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => onReset(user.id)}
                          className="flex items-start gap-3 rounded-lg border border-border/50 px-3 py-3 text-left transition-colors hover:bg-muted/20"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background">
                            <KeyRound className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">Atur ulang kata sandi</p>
                            <p className="text-xs text-muted-foreground">Kembalikan sandi ke nilai awal sesuai pengaturan sistem.</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(user.id)}
                          className="flex items-start gap-3 rounded-lg border border-destructive/25 px-3 py-3 text-left transition-colors hover:bg-destructive/10"
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-destructive/20 bg-background">
                            <Trash2 className="size-4 text-destructive/70" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">Nonaktifkan akun</p>
                            <p className="text-xs text-muted-foreground">Akun akan dinonaktifkan dan relasi aktif akan dibersihkan sesuai aturan role.</p>
                          </div>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-start gap-3 rounded-lg border border-border/50 px-3 py-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background">
                          <Shield className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Akun sistem terlindungi</p>
                          <p className="text-xs text-muted-foreground">
                            Akun `superadmin` tetap dapat dilihat, tetapi tidak dapat dihapus atau diatur ulang dari halaman ini.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 px-6 py-4">
            <div className="flex justify-end">
              <Button type="button" variant="outline" className="h-9 rounded-lg border-border/50 px-4 text-xs font-medium" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
