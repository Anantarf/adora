"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCcw, UserRoundCog, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMyCoachProfile, useUpsertOwnCoachProfile } from "@/hooks/use-coach-profiles";
import { toUserErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import {
  applyCoachProfileState,
  CoachProfileFields,
  uploadCoachProfileAsset,
} from "@/components/features/coach/coach-profile-form-shared";

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
              : "Terjadi kendala saat mengambil data coach. Coba muat ulang halaman."}
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
      <section className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/75">
            Portal Coach
          </p>
          <h1 className="mt-2 font-heading text-2xl tracking-[0.08em] text-foreground">
            Profil dan Identitas Coach
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Rapikan biodata coach agar tampilan admin, parent, dan dokumen rapor membaca identitas yang sama secara konsisten.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
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
              Assignment Aktif
            </p>
            <div className="mt-2 flex items-center gap-2 text-foreground">
              <Users className="size-4 text-primary" />
              <p className="text-lg font-semibold">{assignmentCount} kelompok</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Assignment tetap dikelola admin, tetapi ditampilkan di sini sebagai referensi kerja coach.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-foreground">
              <UserRoundCog className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Profil Coach</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Perbarui biodata, foto profil, lisensi, dan tanda tangan rapor Anda. Assignment kelompok tetap dikelola admin.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            Username: <span className="font-semibold">{coachUser?.username ?? "-"}</span>
          </div>
        </div>

        <div className="mt-5 space-y-5">
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
                Informasi ini ditampilkan sebagai referensi. Perubahan assignment tetap dilakukan admin.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(coachUser?.coachProfile?.assignments ?? []).length > 0 ? (
                coachUser?.coachProfile?.assignments.map((assignment) => (
                  <span
                    key={assignment.group.id}
                    className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {assignment.group.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Belum ada kelompok yang di-assign admin.</span>
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
    </div>
  );
}
