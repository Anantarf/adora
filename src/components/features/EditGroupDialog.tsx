"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateGroup, type Group } from "@/hooks/use-groups";
import { useHomebases } from "@/hooks/use-homebases";
import { toast } from "sonner";
import { buildGroupDescriptionPayload, parseGroupMetaDescription } from "@/lib/group-meta";
import { GroupFormFields } from "@/components/features/GroupFormFields";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, Loader2 } from "lucide-react";

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
  const [isSchool, setIsSchool] = useState(false);
  const [schoolLevel, setSchoolLevel] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: group.name, description: group.description || "", homebaseId: group.homebase?.id },
  });

  useEffect(() => {
    if (open) {
      const parsed = parseGroupMetaDescription(group.description);
      setIsKu(typeof parsed.targetKu === "number");
      setTargetKu(parsed.targetKu ? String(parsed.targetKu) : "");
      setIsSchool(typeof parsed.schoolLevel === "string");
      setSchoolLevel(parsed.schoolLevel || "");
      reset({ name: group.name, description: group.description || "", homebaseId: group.homebase?.id });
    }
  }, [group, open, reset]);

  const onSubmit = async (data: GroupForm) => {
    if (isKu && !targetKu) { toast.error("Umur tidak boleh kosong untuk Kelompok Umur!"); return; }
    if (isSchool && !schoolLevel) { toast.error("Silakan pilih tingkat sekolah yang sesuai!"); return; }

    try {
      const descPayload = buildGroupDescriptionPayload({
        targetKu: isKu && targetKu ? parseInt(targetKu, 10) : undefined,
        schoolLevel: isSchool && schoolLevel ? schoolLevel : undefined,
      });
      await updateGroup({ id: group.id, data: { name: data.name, description: descPayload, homebaseId: data.homebaseId || null } });
      toast.success(`${group.name} berhasil diperbarui!`);
      onOpenChange(false);
    } catch {
      toast.error("Gagal memperbarui kelompok. Coba lagi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-foreground tracking-wide flex items-center gap-2">
            <Edit2 className="size-5 text-primary" /> Ubah Kelompok
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Perbarui nama, kategori usia, sekolah, atau lokasi latihan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <GroupFormFields
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isKu={isKu}
            setIsKu={setIsKu}
            targetKu={targetKu}
            setTargetKu={setTargetKu}
            isSchool={isSchool}
            setIsSchool={setIsSchool}
            schoolLevel={schoolLevel}
            setSchoolLevel={setSchoolLevel}
            homebases={homebases}
            checkboxIdSuffix="_edit"
          />

          <div className="pt-4 flex w-full justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="h-10 font-semibold text-sm">
              Batal
            </Button>
            <Button type="submit" disabled={isPending} className="h-10 font-semibold text-sm">
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
