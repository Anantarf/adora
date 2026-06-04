"use client";

import { Loader2, Upload } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CoachProfileFormValues = {
  fullName: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: string;
  photoUrl: string;
  licenseUrl: string;
};

export const COACH_GENDER_OPTIONS = ["Laki-laki", "Perempuan"] as const;

export function applyCoachProfileState(
  source: {
    name: string | null;
    coachProfile: {
      fullName: string;
      placeOfBirth: string | null;
      dateOfBirth: Date | string | null;
      gender: string | null;
      photoUrl: string | null;
      licenseUrl: string | null;
    } | null;
  },
  setters: {
    setFullName: (value: string) => void;
    setPlaceOfBirth: (value: string) => void;
    setDateOfBirth: (value: string) => void;
    setGender: (value: string) => void;
    setPhotoUrl: (value: string) => void;
    setLicenseUrl: (value: string) => void;
  },
) {
  setters.setFullName(source.coachProfile?.fullName ?? source.name ?? "");
  setters.setPlaceOfBirth(source.coachProfile?.placeOfBirth ?? "");
  setters.setDateOfBirth(
    source.coachProfile?.dateOfBirth
      ? new Date(source.coachProfile.dateOfBirth).toISOString().slice(0, 10)
      : "",
  );
  setters.setGender(source.coachProfile?.gender ?? "");
  setters.setPhotoUrl(source.coachProfile?.photoUrl ?? "");
  setters.setLicenseUrl(source.coachProfile?.licenseUrl ?? "");
}

export async function uploadCoachProfileAsset(file: File, assetKey: string) {
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

export function CoachProfileFields({
  values,
  onChange,
  uploadingKey,
  onUpload,
  licenseAccept = "image/png,image/jpeg,application/pdf",
}: {
  values: CoachProfileFormValues;
  onChange: {
    setFullName: (value: string) => void;
    setPlaceOfBirth: (value: string) => void;
    setDateOfBirth: (value: string) => void;
    setGender: (value: string) => void;
  };
  uploadingKey: "photo" | "license" | null;
  onUpload: (file: File, kind: "photo" | "license") => Promise<void>;
  licenseAccept?: string;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="ml-1 text-xs font-medium text-muted-foreground">Nama Lengkap</label>
          <Input value={values.fullName} onChange={(event) => onChange.setFullName(event.target.value)} className="h-11 rounded-xl border-border/50 bg-background/50" />
        </div>
        <div className="space-y-1.5">
          <label className="ml-1 text-xs font-medium text-muted-foreground">Tempat Lahir</label>
          <Input value={values.placeOfBirth} onChange={(event) => onChange.setPlaceOfBirth(event.target.value)} className="h-11 rounded-xl border-border/50 bg-background/50" />
        </div>
        <div className="space-y-1.5">
          <label className="ml-1 text-xs font-medium text-muted-foreground">Tanggal Lahir</label>
          <Input type="date" value={values.dateOfBirth} onChange={(event) => onChange.setDateOfBirth(event.target.value)} className="h-11 rounded-xl border-border/50 bg-background/50" />
        </div>
        <div className="space-y-1.5">
          <label className="ml-1 text-xs font-medium text-muted-foreground">Jenis Kelamin</label>
          <Select value={values.gender || undefined} onValueChange={(value) => onChange.setGender(value ?? "")}>
            <SelectTrigger className="h-11 w-full rounded-xl border-border/50 bg-background/50">
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              {COACH_GENDER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="ml-1 text-xs font-medium text-muted-foreground">Foto Profil Coach</label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border/50 bg-background/40 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
            <div className="flex items-center gap-3">
              {uploadingKey === "photo" ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <Upload className="size-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {values.photoUrl ? "Ganti foto coach" : "Unggah foto coach"}
              </span>
            </div>
            <span className="text-xs font-medium text-primary">Pilih File</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                await onUpload(file, "photo");
                event.target.value = "";
              }}
            />
          </label>
          {values.photoUrl ? (
            <a href={values.photoUrl} target="_blank" rel="noreferrer" className="inline-flex text-[11px] font-medium text-primary hover:underline">
              Lihat foto terunggah
            </a>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-xs font-medium text-muted-foreground">Lisensi Coach</label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border/50 bg-background/40 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
            <div className="flex items-center gap-3">
              {uploadingKey === "license" ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <Upload className="size-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {values.licenseUrl ? "Ganti file lisensi" : "Unggah lisensi coach"}
              </span>
            </div>
            <span className="text-xs font-medium text-primary">Pilih File</span>
            <input
              type="file"
              accept={licenseAccept}
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                await onUpload(file, "license");
                event.target.value = "";
              }}
            />
          </label>
          {values.licenseUrl ? (
            <a href={values.licenseUrl} target="_blank" rel="noreferrer" className="inline-flex text-[11px] font-medium text-primary hover:underline">
              Lihat lisensi terunggah
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
}
