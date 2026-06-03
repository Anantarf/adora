"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload, UserRoundCog } from "lucide-react";
import { toast } from "sonner";

import { useCoachProfileByUser, useUpsertCoachProfile } from "@/hooks/use-coach-profiles";
import { useGroups } from "@/hooks/use-groups";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toUserErrorMessage } from "@/lib/utils";
import type { UserItem } from "./UserAccountCard";

async function uploadAsset(file: File, assetKey: string) {
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

export function CoachProfileDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);
  const [uploadingKey, setUploadingKey] = useState<"photo" | "license" | null>(null);

  const { data: coachUser, isLoading } = useCoachProfileByUser(user?.id ?? null, open);
  const { data: groups } = useGroups();
  const { mutateAsync: saveCoachProfile, isPending } = useUpsertCoachProfile();
  const genderOptions = ["Laki-laki", "Perempuan"] as const;

  useEffect(() => {
    if (!coachUser) {
      return;
    }

    setFullName(coachUser.coachProfile?.fullName ?? coachUser.name ?? "");
    setPlaceOfBirth(coachUser.coachProfile?.placeOfBirth ?? "");
    setDateOfBirth(
      coachUser.coachProfile?.dateOfBirth
        ? new Date(coachUser.coachProfile.dateOfBirth).toISOString().slice(0, 10)
        : "",
    );
    setGender(coachUser.coachProfile?.gender ?? "");
    setPhotoUrl(coachUser.coachProfile?.photoUrl ?? "");
    setLicenseUrl(coachUser.coachProfile?.licenseUrl ?? "");
    setAssignedGroupIds(
      coachUser.coachProfile?.assignments.map((assignment) => assignment.group.id) ?? [],
    );
  }, [coachUser]);

  if (!user) {
    return null;
  }

  const handleUpload = async (
    file: File,
    kind: "photo" | "license",
    setter: (value: string) => void,
  ) => {
    setUploadingKey(kind);
    try {
      const assetKey = `coach_${kind}_${user.id}_${Date.now()}`;
      const url = await uploadAsset(file, assetKey);
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
      userId: user.id,
      fullName,
      placeOfBirth,
      dateOfBirth,
      gender,
      photoUrl,
      licenseUrl,
      assignedGroupIds,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden border-border/50 bg-card p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/50 px-6 pt-6 pb-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <UserRoundCog className="size-5 text-primary" />
            Kelola Profil Coach
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Lengkapi biodata coach, file lisensi, dan assignment kelompok latihan.
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Memuat profil coach...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-muted-foreground">Nama Lengkap</label>
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11 rounded-xl border-border/50 bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-muted-foreground">Tempat Lahir</label>
                  <Input value={placeOfBirth} onChange={(event) => setPlaceOfBirth(event.target.value)} className="h-11 rounded-xl border-border/50 bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-muted-foreground">Tanggal Lahir</label>
                  <Input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="h-11 rounded-xl border-border/50 bg-background/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-muted-foreground">Jenis Kelamin</label>
                  <Select value={gender || undefined} onValueChange={(value) => setGender(value ?? "")}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-border/50 bg-background/50">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
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
                        {photoUrl ? "Ganti foto coach" : "Unggah foto coach"}
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
                        await handleUpload(file, "photo", setPhotoUrl);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {photoUrl ? (
                    <a href={photoUrl} target="_blank" rel="noreferrer" className="inline-flex text-[11px] font-medium text-primary hover:underline">
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
                        {licenseUrl ? "Ganti file lisensi" : "Unggah lisensi coach"}
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
                        await handleUpload(file, "license", setLicenseUrl);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {licenseUrl ? (
                    <a href={licenseUrl} target="_blank" rel="noreferrer" className="inline-flex text-[11px] font-medium text-primary hover:underline">
                      Lihat lisensi terunggah
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Assignment Kelompok</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pilih kelompok latihan yang saat ini ditangani coach ini.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {(groups ?? []).map((group) => {
                    const checked = assignedGroupIds.includes(group.id);

                    return (
                      <label
                        key={group.id}
                        className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                          checked
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/50 bg-background/40 hover:bg-muted/20"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setAssignedGroupIds((previous) =>
                              event.target.checked
                                ? [...previous, group.id]
                                : previous.filter((groupId) => groupId !== group.id),
                            );
                          }}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{group.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {group._count?.player ?? 0} pemain aktif
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 px-6 py-4">
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
      </DialogContent>
    </Dialog>
  );
}
