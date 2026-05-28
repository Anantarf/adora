"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddGroup } from "@/hooks/use-groups";
import { useHomebases } from "@/hooks/use-homebases";
import type { GroupCategory } from "@/lib/group-meta";
import { toast } from "sonner";
import { GroupFormFields } from "@/components/features/GroupFormFields";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

const groupSchema = z.object({
  name: z.string().min(2, "Nama Kelompok minimal 2 karakter"),
  homebaseId: z.string().optional(),
});

type GroupForm = z.infer<typeof groupSchema>;

interface AddGroupDialogProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function AddGroupDialog({ externalOpen, onExternalOpenChange, hideTrigger }: AddGroupDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = onExternalOpenChange ?? setInternalOpen;

  const [category, setCategory] = useState<GroupCategory>("KELOMPOK_UMUR");
  const [targetKu, setTargetKu] = useState("");
  const [schoolLevel, setSchoolLevel] = useState("");

  const { mutateAsync: addGroup, isPending } = useAddGroup();
  const { data: homebases = [] } = useHomebases();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
  });

  const onSubmit = async (data: GroupForm) => {
    if (category === "KELOMPOK_UMUR" && !targetKu) { toast.error("Batas umur wajib diisi untuk kategori Kelompok Umur."); return; }
    if (category === "SEKOLAH" && !schoolLevel) { toast.error("Tingkat sekolah wajib dipilih."); return; }

    try {
      await addGroup({
        ...data,
        category,
        targetKu: category === "KELOMPOK_UMUR" && targetKu ? parseInt(targetKu, 10) : undefined,
        schoolLevel: category === "SEKOLAH" && schoolLevel ? schoolLevel : undefined,
      });

      reset();
      setCategory("KELOMPOK_UMUR"); setTargetKu(""); setSchoolLevel("");
      setOpen(false);
      toast.success("Kelompok baru berhasil ditambahkan!");
    } catch {
      toast.error("Gagal menambahkan kelompok. Silakan coba kembali.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger
          render={
            <Button size="xl" className="w-full sm:w-auto">
              <Plus className="size-4" /> Tambah Kelompok
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-foreground tracking-wide">Tambah Kelompok Latihan</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Buat kelompok baru berdasarkan usia atau sekolah.</DialogDescription>
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
          />

          <div className="pt-4 flex w-full justify-end">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto h-10 font-semibold text-sm">
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
