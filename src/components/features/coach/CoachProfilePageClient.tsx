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
  type CoachProfileFormValues,
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

const EMPTY_PROFILE: CoachProfileFormValues = {
  fullName: "",
  placeOfBirth: "",
  dateOfBirth: "",
  gender: "",
  photoUrl: "",
  licenseUrl: "",
  signatureUrl: "",
};

export function CoachProfilePageClient() {
  const { data: coachUser, isLoading, isError, refetch, error } = useMyCoachProfile();
  const { mutateAsync: saveCoachProfile, isPending } = useUpsertOwnCoachProfile();
  const [draftProfile, setDraftProfile] = useState<CoachProfileFormValues>(EMPTY_PROFILE);
  const [savedProfile, setSavedProfile] = useState<CoachProfileFormValues>(EMPTY_PROFILE);
  const [uploadingKey, setUploadingKey] = useState<"photo" | "license" | "signature" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);

  const updateDraftProfile = (field: keyof CoachProfileFormValues, value: string) => {
    setDraftProfile((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    if (!coachUser) {
      return;
    }

    const nextProfile: CoachProfileFormValues = {
      fullName: "",
      placeOfBirth: "",
      dateOfBirth: "",
      gender: "",
      photoUrl: "",
      licenseUrl: "",
      signatureUrl: "",
    };

    applyCoachProfileState(coachUser, {
      setFullName: (value) => {
        nextProfile.fullName = value;
      },
      setPlaceOfBirth: (value) => {
        nextProfile.placeOfBirth = value;
      },
      setDateOfBirth: (value) => {
        nextProfile.dateOfBirth = value;
      },
      setGender: (value) => {
        nextProfile.gender = value;
      },
      setPhotoUrl: (value) => {
        nextProfile.photoUrl = value;
      },
      setLicenseUrl: (value) => {
        nextProfile.licenseUrl = value;
      },
      setSignatureUrl: (value) => {
        nextProfile.signatureUrl = value;
      },
    });
    setSavedProfile(nextProfile);
    setDraftProfile(nextProfile);
    setFailedPhotoUrl(null);
  }, [coachUser]);

  const handleEditToggle = () => {
    if (isEditing) {
      setDraftProfile(savedProfile);
      setIsEditing(false);
      return;
    }

    setDraftProfile(savedProfile);
    setIsEditing(true);
  };

  const handleUpload = async (
    file: File,
    kind: "photo" | "license" | "signature",
    field: "photoUrl" | "licenseUrl" | "signatureUrl",
  ) => {
    if (!coachUser?.id) {
      toast.error("Profil coach belum siap. Muat ulang halaman lalu coba lagi.");
      return;
    }

    setUploadingKey(kind);
    try {
      const assetKey = `coach_${kind}_${coachUser.id}_${Date.now()}`;
      const url = await uploadCoachProfileAsset(file, assetKey);
      updateDraftProfile(field, url);
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
      fullName: draftProfile.fullName,
      placeOfBirth: draftProfile.placeOfBirth,
      dateOfBirth: draftProfile.dateOfBirth,
      gender: draftProfile.gender,
      photoUrl: draftProfile.photoUrl,
      licenseUrl: draftProfile.licenseUrl,
      signatureUrl: draftProfile.signatureUrl,
    });
    setSavedProfile(draftProfile);
    setIsEditing(false);
  };

  const assignmentCount = coachUser?.coachProfile?.assignments.length ?? 0;
  const profileCompletionCount = [
    savedProfile.fullName.trim(),
    savedProfile.placeOfBirth.trim(),
    savedProfile.dateOfBirth.trim(),
    savedProfile.gender.trim(),
    savedProfile.photoUrl.trim(),
    savedProfile.licenseUrl.trim(),
    savedProfile.signatureUrl.trim(),
  ].filter(Boolean).length;
  const profileCompletionLabel =
    profileCompletionCount >= 6 ? "Siap ditampilkan" : profileCompletionCount >= 4 ? "Perlu dilengkapi" : "Masih minim";
  const assignedGroups = coachUser?.coachProfile?.assignments ?? [];
  const showSavedPhoto = Boolean(savedProfile.photoUrl && failedPhotoUrl !== savedProfile.photoUrl);

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
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Lihat data diri pelatih yang tampil ke sistem, lalu perbarui biodata, foto, lisensi, dan tanda tangan bila diperlukan.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border border-border/50 bg-background/60 px-3 py-1.5 font-medium flex items-center gap-2">
            <UserRound className="size-3.5" />
            {coachUser?.username ?? "-"}
          </span>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.38fr)]">
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="border-b border-border/50 bg-muted/[0.16] p-5 lg:border-b-0 lg:border-r">
              <div className="mx-auto flex max-w-60 flex-col items-center text-center">
                <div className="flex size-36 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background/60">
                  {showSavedPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={savedProfile.photoUrl}
                      alt={savedProfile.fullName || "Foto coach"}
                      className="h-full w-full object-cover"
                      onError={() => setFailedPhotoUrl(savedProfile.photoUrl)}
                    />
                  ) : (
                    <UserRound className="size-14 text-muted-foreground/35" />
                  )}
                </div>
                <p className="mt-4 text-lg font-semibold text-foreground">{savedProfile.fullName || coachUser?.name || "Nama coach belum diisi"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{savedProfile.gender || "Jenis kelamin belum diisi"}</p>
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
                <Button type="button" variant={isEditing ? "outline" : "default"} onClick={handleEditToggle}>
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
                  <p className="mt-2 text-sm font-semibold text-foreground">{savedProfile.fullName || "-"}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MapPin className="size-4 text-primary" />
                    Tempat Lahir
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{savedProfile.placeOfBirth || "-"}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-4 text-primary" />
                    Tanggal Lahir
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{formatDateLabel(savedProfile.dateOfBirth)}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <UserRound className="size-4 text-primary" />
                    Jenis Kelamin
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{savedProfile.gender || "-"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <a
                  href={savedProfile.licenseUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-xl border border-border/50 bg-background/40 p-4 ${savedProfile.licenseUrl ? "transition-colors hover:border-primary/30 hover:bg-primary/5" : "pointer-events-none"}`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FileBadge className="size-4 text-primary" />
                    Lisensi Coach
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{savedProfile.licenseUrl ? "File lisensi tersedia" : "Belum diunggah"}</p>
                </a>
                <a
                  href={savedProfile.signatureUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-xl border border-border/50 bg-background/40 p-4 ${savedProfile.signatureUrl ? "transition-colors hover:border-primary/30 hover:bg-primary/5" : "pointer-events-none"}`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Signature className="size-4 text-primary" />
                    Tanda Tangan Rapor
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{savedProfile.signatureUrl ? "File tanda tangan tersedia" : "Belum diunggah"}</p>
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
              values={draftProfile}
              onChange={{
                setFullName: (value) => updateDraftProfile("fullName", value),
                setPlaceOfBirth: (value) => updateDraftProfile("placeOfBirth", value),
                setDateOfBirth: (value) => updateDraftProfile("dateOfBirth", value),
                setGender: (value) => updateDraftProfile("gender", value),
              }}
              uploadingKey={uploadingKey}
              onUpload={async (file, kind) =>
                handleUpload(
                  file,
                  kind,
                  kind === "photo"
                    ? "photoUrl"
                    : kind === "license"
                      ? "licenseUrl"
                      : "signatureUrl",
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
