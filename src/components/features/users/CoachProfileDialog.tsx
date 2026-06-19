"use client";

import { useEffect, useState } from "react";
import { Loader2, UserRoundCog } from "lucide-react";
import { toast } from "sonner";

import { useCoachProfileByUser, useUpsertCoachProfile } from "@/hooks/use-coach-profiles";
import { useGroups } from "@/hooks/use-groups";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toUserErrorMessage } from "@/lib/utils";
import type { UserItem } from "./UserAccountCard";
import {
  applyCoachProfileState,
  CoachProfileFields,
  uploadCoachProfileAsset,
} from "@/components/features/coach/coach-profile-form-shared";

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
  const [signatureUrl, setSignatureUrl] = useState("");
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);
  const [uploadingKey, setUploadingKey] = useState<"photo" | "license" | "signature" | null>(null);

  const { data: coachUser, isLoading } = useCoachProfileByUser(user?.id ?? null, open);
  const { data: groups } = useGroups();
  const { mutateAsync: saveCoachProfile, isPending } = useUpsertCoachProfile();

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
    setAssignedGroupIds(
      coachUser.coachProfile?.assignments.map((assignment) => assignment.group.id) ?? [],
    );
  }, [coachUser]);

  if (!user) {
    return null;
  }

  const handleUpload = async (
    file: File,
    kind: "photo" | "license" | "signature",
    setter: (value: string) => void,
  ) => {
    setUploadingKey(kind);
    try {
      const assetKey = `coach_${kind}_${user.id}_${Date.now()}`;
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
    await saveCoachProfile({
      userId: user.id,
      fullName,
      placeOfBirth,
      dateOfBirth,
      gender,
      photoUrl,
      licenseUrl,
      signatureUrl,
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
            Lengkapi biodata coach, lisensi, tanda tangan rapor, dan penugasan kelompok latihan.
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
                licenseAccept="image/png,image/jpeg"
              />

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Penugasan Kelompok</h4>
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
                          <p className="text-xs text-muted-foreground">
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
