"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateGroup, type Group } from "@/hooks/use-groups";
import { useHomebases } from "@/hooks/use-homebases";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildGroupDescriptionPayload, parseGroupMetaDescription } from "@/lib/group-meta";
import { Edit2, Loader2 } from "lucide-react";

const HOMEBASE_NONE = "__none__";

const groupSchema = z.object({
  name: z.string().min(2, "Nama Kelompok minimal 2 karakter"),
  description: z.string().optional(),
  homebaseId: z.string().optional(),
});

type GroupForm = z.infer<typeof groupSchema>;

interface EditGroupDialogProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGroupDialog({ group, open, onOpenChange }: EditGroupDialogProps) {
  const { mutateAsync: updateGroup, isPending } = useUpdateGroup();
  const { data: homebases = [] } = useHomebases();

  const [isKu, setIsKu] = useState(false);
  const [targetKu, setTargetKu] = useState("");
  const [isSchool, setIsSekolah] = useState(false);
  const [schoolLevel, setSchoolLevel] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group.name,
      description: group.description || "",
      homebaseId: group.homebase?.id,
    },
  });

  useEffect(() => {
    if (open) {
      const parsed = parseGroupMetaDescription(group.description);
      const isK = typeof parsed.targetKu === "number";
      const tK = parsed.targetKu ? String(parsed.targetKu) : "";
      const isS = typeof parsed.schoolLevel === "string";
      const sL = parsed.schoolLevel || "";

      setIsKu(isK);
      setTargetKu(tK);
      setIsSekolah(isS);
      setSchoolLevel(sL);

      reset({
        name: group.name,
        description: group.description || "",
        homebaseId: group.homebase?.id,
      });
    }
  }, [group, open, reset]);

  const onSubmit = async (data: GroupForm) => {
    if (isKu && !targetKu) {
      toast.error("Umur tidak boleh kosong untuk Kelompok Umur!");
      return;
    }
    if (isSchool && !schoolLevel) {
      toast.error("Silakan pilih tingkat sekolah yang sesuai!");
      return;
    }

    try {
      const descPayload = buildGroupDescriptionPayload({
        targetKu: isKu && targetKu ? parseInt(targetKu, 10) : undefined,
        schoolLevel: isSchool && schoolLevel ? schoolLevel : undefined,
      });

      await updateGroup({
        id: group.id,
        data: {
          name: data.name,
          description: descPayload,
          homebaseId: data.homebaseId || null,
        },
      });
      toast.success(`${group.name} berhasil diperbarui!`);
      onOpenChange(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal memperbarui.";
      toast.error("Error: " + msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase text-foreground tracking-widest flex items-center gap-2">
            <Edit2 className="size-5 text-primary" />
            Ubah Kelompok
          </DialogTitle>
          <DialogDescription className="text-xs font-medium tracking-wide">Update nama, kategori usia, asal sekolah, atau homebase.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="group_name" className="text-xs uppercase font-semibold tracking-widest text-muted-foreground cursor-pointer">
              Nama Kelompok / Asal Sekolah
            </label>
            <Input id="group_name" {...register("name")} defaultValue={group.name} placeholder="Contoh: KU-16 Putra" className="h-11" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-4 pt-2 pb-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isUsia_edit"
                  checked={isKu}
                  onChange={(e) => {
                    setIsKu(e.target.checked);
                    if (e.target.checked) setIsSekolah(false);
                  }}
                  className="size-4 cursor-pointer rounded accent-primary bg-background border-border"
                />
                <label htmlFor="isUsia_edit" className="text-xs uppercase font-semibold tracking-widest text-muted-foreground cursor-pointer whitespace-nowrap">
                  Kelompok Umur
                </label>
              </div>

              {isKu && (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <Input type="text" pattern="\d*" maxLength={2} value={targetKu} onChange={(e) => setTargetKu(e.target.value.replace(/\D/g, ""))} placeholder="16" className="h-9 w-12 text-center text-sm font-medium" />
                  <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">TAHUN</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isSekolah_edit"
                  checked={isSchool}
                  onChange={(e) => {
                    setIsSekolah(e.target.checked);
                    if (e.target.checked) setIsKu(false);
                  }}
                  className="size-4 cursor-pointer rounded accent-primary bg-background border-border"
                />
                <label htmlFor="isSekolah_edit" className="text-xs uppercase font-semibold tracking-widest text-muted-foreground cursor-pointer whitespace-nowrap">
                  Sekolah
                </label>
              </div>

              {isSchool && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <Select value={schoolLevel} onValueChange={(val: string | null) => setSchoolLevel(val || "")}>
                    <SelectTrigger className="h-9 w-full sm:w-48 font-medium">
                      <SelectValue placeholder="Pilih Tingkat Sekolah" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TK/RA">TK/RA</SelectItem>
                      <SelectItem value="SD/MI">SD/MI</SelectItem>
                      <SelectItem value="SMP/MTS">SMP/MTS</SelectItem>
                      <SelectItem value="SMA/MA">SMA/MA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {homebases.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">Homebase</label>
              <Select value={watch("homebaseId") ?? HOMEBASE_NONE} onValueChange={(val) => setValue("homebaseId", !val || val === HOMEBASE_NONE ? undefined : val)}>
                <SelectTrigger className="h-11 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={HOMEBASE_NONE} className="text-muted-foreground">
                    — Tanpa Homebase —
                  </SelectItem>
                  {homebases.map((hb) => (
                    <SelectItem key={hb.id} value={hb.id}>
                      {hb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="pt-4 flex w-full justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="h-11 font-bold uppercase tracking-widest text-xs">
              Batalkan
            </Button>
            <Button type="submit" disabled={isPending} className="h-11 font-bold uppercase tracking-widest text-xs">
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
