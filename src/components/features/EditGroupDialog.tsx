"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateGroup, type Group } from "@/hooks/use-groups";
import { useHomebases } from "@/hooks/use-homebases";
import { toast } from "sonner";
import { parseGroupMetaDescription, type GroupCategory } from "@/lib/group-meta";
import { GroupFormFields } from "@/components/features/GroupFormFields";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, Loader2 } from "lucide-react";

const groupSchema = z.object({
  name: z.string().min(2, "Nama Kelompok minimal 2 karakter"),
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

  const initialParsed = parseGroupMetaDescription(group.description);
  const [category, setCategory] = useState<GroupCategory>(group.category ?? initialParsed.category ?? "KELOMPOK_UMUR");
  const [targetKu, setTargetKu] = useState(group.targetKu ? String(group.targetKu) : initialParsed.targetKu ? String(initialParsed.targetKu) : "");
  const [schoolLevel, setSchoolLevel] = useState(group.schoolLevel || initialParsed.schoolLevel || "");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: group.name, homebaseId: group.homebase?.id ?? undefined },
  });



  const onSubmit = async (data: GroupForm) => {
    if (category === "KELOMPOK_UMUR" && !targetKu) { toast.error("Batas umur wajib diisi untuk kategori Kelompok Umur."); return; }
    if (category === "SEKOLAH" && !schoolLevel) { toast.error("Tingkat sekolah wajib dipilih."); return; }

    try {
      await updateGroup({
        id: group.id,
        data: {
          name: data.name,
          category,
          targetKu: category === "KELOMPOK_UMUR" && targetKu ? parseInt(targetKu, 10) : null,
          schoolLevel: category === "SEKOLAH" && schoolLevel ? schoolLevel : null,
          homebaseId: data.homebaseId || null,
        },
      });
      toast.success(`${group.name} berhasil diperbarui!`);
      onOpenChange(false);
    } catch {
      toast.error("Gagal memperbarui kelompok. Silakan coba kembali.");
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
            category={category}
            setCategory={setCategory}
            targetKu={targetKu}
            setTargetKu={setTargetKu}
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
