"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  FileBadge,
  IdCard,
  Loader2,
  MapPin,
  PenLine,
  RefreshCcw,
  ShieldCheck,
  Signature,
  UserRound,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMyCoachProfile, useUpsertOwnCoachProfile } from "@/hooks/use-coach-profiles";
import { toUserErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import {
  applyCoachProfileState,
  CoachProfileFields,
  uploadCoachProfileAsset,
} from "@/components/features/coach/coach-profile-form-shared";

function formatDateLabel(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CoachProfilePageClient() {
  const { data: coachUser, isLoading, isError, refetch, error } = useMyCoachProfile();
  const { mutateAsync: saveCoachProfile, isPending } = useUpsertOwnCoachProfile();
  const [fullName, setFullName] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [uploadingKey, setUploadingKey] = useState<"photo" | "license" | "signature" | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!coachUser) {
      return;
    }

    applyCoachProfileState(coachUser, {
      setFullName,
      setPlaceOfBirth,
      setDateOfBirth,
      setGender,
      setPhotoUrl,
      setLicenseUrl,
      setSignatureUrl,
    });
  }, [coachUser]);

  const handleUpload = async (
    file: File,
    kind: "photo" | "license" | "signature",
    setter: (value: string) => void,
  ) => {
    if (!coachUser?.id) {
      toast.error("Profil coach belum siap. Muat ulang halaman lalu coba lagi.");
      return;
    }

    setUploadingKey(kind);
    try {
      const assetKey = `coach_${kind}_${coachUser.id}_${Date.now()}`;
      const url = await uploadCoachProfileAsset(file, assetKey);
      setter(url);
      toast.success(
        `File ${
          kind === "photo" ? "foto" : kind === "license" ? "lisensi" : "tanda tangan"
        } berhasil diunggah.`,
      );
    } catch (error) {
      toast.error(toUserErrorMessage(error, "Upload gagal."));
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSubmit = async () => {
    if (!coachUser?.id) {
      toast.error("Data akun coach belum tersedia. Coba muat ulang halaman.");
      return;
    }

    await saveCoachProfile({
      fullName,
      placeOfBirth,
      dateOfBirth,
      gender,
      photoUrl,
      licenseUrl,
      signatureUrl,
    });
    setIsEditing(false);
  };

  const assignmentCount = coachUser?.coachProfile?.assignments.length ?? 0;
  const profileCompletionCount = [
    fullName.trim(),
    placeOfBirth.trim(),
    dateOfBirth.trim(),
    gender.trim(),
    photoUrl.trim(),
    licenseUrl.trim(),
    signatureUrl.trim(),
  ].filter(Boolean).length;
  const profileCompletionLabel =
    profileCompletionCount >= 6 ? "Siap ditampilkan" : profileCompletionCount >= 4 ? "Perlu dilengkapi" : "Masih minim";
  const assignedGroups = coachUser?.coachProfile?.assignments ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-2 rounded-2xl border border-border/50 bg-card">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Memuat profil coach...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Profil coach gagal dimuat</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Terjadi kendala saat mengambil data profil coach. Coba muat ulang halaman."}
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
            Profil Coach
          </p>
          <h1 className="font-heading text-2xl tracking-[0.08em] text-foreground md:text-[2rem]">
            Profil dan Identitas Coach
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Lihat data diri pelatih yang tampil ke sistem, lalu perbarui biodata, foto, lisensi, dan tanda tangan bila diperlukan.
          </p>
        </div>
        <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground md:text-sm">
          Username: <span className="font-semibold text-foreground">{coachUser?.username ?? "-"}</span>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.38fr)]">
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="border-b border-border/50 bg-muted/[0.16] p-5 lg:border-b-0 lg:border-r">
              <div className="mx-auto flex max-w-60 flex-col items-center text-center">
                <div className="flex size-36 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background/60">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt={fullName || "Foto coach"} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="size-14 text-muted-foreground/35" />
                  )}
                </div>
                <p className="mt-4 text-lg font-semibold text-foreground">{fullName || coachUser?.name || "Nama coach belum diisi"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{gender || "Jenis kelamin belum diisi"}</p>
                <div className="mt-4 inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  {profileCompletionLabel}
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Data Diri Pelatih</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Data ini menjadi identitas utama coach di portal, tampilan orang tua, dan rapor.
                  </p>
                </div>
                <Button type="button" variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing((value) => !value)}>
                  {isEditing ? (
                    <>
                      <X className="mr-2 size-4" />
                      Tutup Edit
                    </>
                  ) : (
                    <>
                      <PenLine className="mr-2 size-4" />
                      Edit Profil
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <IdCard className="size-4 text-primary" />
                    Nama Lengkap
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{fullName || "-"}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MapPin className="size-4 text-primary" />
                    Tempat Lahir
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{placeOfBirth || "-"}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-4 text-primary" />
                    Tanggal Lahir
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{formatDateLabel(dateOfBirth)}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <UserRound className="size-4 text-primary" />
                    Jenis Kelamin
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{gender || "-"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <a
                  href={licenseUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-xl border border-border/50 bg-background/40 p-4 ${licenseUrl ? "transition-colors hover:border-primary/30 hover:bg-primary/5" : "pointer-events-none"}`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FileBadge className="size-4 text-primary" />
                    Lisensi Coach
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{licenseUrl ? "File lisensi tersedia" : "Belum diunggah"}</p>
                </a>
                <a
                  href={signatureUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-xl border border-border/50 bg-background/40 p-4 ${signatureUrl ? "transition-colors hover:border-primary/30 hover:bg-primary/5" : "pointer-events-none"}`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Signature className="size-4 text-primary" />
                    Tanda Tangan Rapor
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{signatureUrl ? "File tanda tangan tersedia" : "Belum diunggah"}</p>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Status Profil
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">{profileCompletionLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {profileCompletionCount} dari 7 data inti sudah terisi.
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Penugasan Aktif
            </p>
            <div className="mt-2 flex items-center gap-2 text-foreground">
              <Users className="size-4 text-primary" />
              <p className="text-lg font-semibold">{assignmentCount} kelompok</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Penugasan tetap dikelola admin.
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Akses Profil
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Data diri bisa diperbarui coach. Penugasan kelompok dikelola admin agar struktur latihan tetap terkunci.
            </p>
          </div>
        </div>
      </section>

      {isEditing ? (
      <section className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mt-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-border/50 pb-4 text-foreground">
            <UserRoundCog className="size-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Setting Profile / Edit</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Perbarui biodata, foto profil, lisensi, dan tanda tangan rapor Anda.
              </p>
            </div>
          </div>

          <CoachProfileFields
            values={{ fullName, placeOfBirth, dateOfBirth, gender, photoUrl, licenseUrl, signatureUrl }}
            onChange={{ setFullName, setPlaceOfBirth, setDateOfBirth, setGender }}
            uploadingKey={uploadingKey}
            onUpload={async (file, kind) =>
              handleUpload(
                file,
                kind,
                kind === "photo"
                  ? setPhotoUrl
                  : kind === "license"
                    ? setLicenseUrl
                    : setSignatureUrl,
              )
            }
          />

          <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Kelompok Saat Ini</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Informasi ini ditampilkan sebagai referensi. Perubahan penugasan tetap dilakukan admin.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {assignedGroups.length > 0 ? (
                assignedGroups.map((assignment) => (
                  <span
                    key={assignment.group.id}
                    className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {assignment.group.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Belum ada kelompok yang ditugaskan admin.</span>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" disabled={isPending || uploadingKey !== null} onClick={handleSubmit}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Profil Coach"
              )}
            </Button>
          </div>
        </div>
      </section>
      ) : null}
    </div>
  );
}
