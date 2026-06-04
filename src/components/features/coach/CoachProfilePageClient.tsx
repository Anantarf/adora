"use client";

import { useEffect, useState } from "react";
import { Loader2, UserRoundCog } from "lucide-react";

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
  const { data: coachUser, isLoading } = useMyCoachProfile();
  const { mutateAsync: saveCoachProfile, isPending } = useUpsertOwnCoachProfile();
  const [fullName, setFullName] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [uploadingKey, setUploadingKey] = useState<"photo" | "license" | null>(null);

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
    });
  }, [coachUser]);

  const handleUpload = async (
    file: File,
    kind: "photo" | "license",
    setter: (value: string) => void,
  ) => {
    setUploadingKey(kind);
    try {
      const assetKey = `coach_${kind}_${coachUser?.id ?? "self"}_${Date.now()}`;
      const url = await uploadCoachProfileAsset(file, assetKey);
      setter(url);
      toast.success(`File ${kind === "photo" ? "foto" : "lisensi"} berhasil diunggah.`);
    } catch (error) {
      toast.error(toUserErrorMessage(error, "Upload gagal."));
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSubmit = async () => {
    await saveCoachProfile({
      fullName,
      placeOfBirth,
      dateOfBirth,
      gender,
      photoUrl,
      licenseUrl,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-2 rounded-2xl border border-border/50 bg-card">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Memuat profil coach...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
      <section className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-foreground">
              <UserRoundCog className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Profil Coach</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Perbarui biodata, foto profil, dan lisensi Anda. Assignment kelompok tetap dikelola admin.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            Username: <span className="font-semibold">{coachUser?.username ?? "-"}</span>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <CoachProfileFields
            values={{ fullName, placeOfBirth, dateOfBirth, gender, photoUrl, licenseUrl }}
            onChange={{ setFullName, setPlaceOfBirth, setDateOfBirth, setGender }}
            uploadingKey={uploadingKey}
            onUpload={async (file, kind) =>
              handleUpload(file, kind, kind === "photo" ? setPhotoUrl : setLicenseUrl)
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
