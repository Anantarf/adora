"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddGroup } from "@/hooks/use-groups";
import { useHomebases } from "@/hooks/use-homebases";
import { buildGroupDescriptionPayload } from "@/lib/group-meta";
import { toast } from "sonner";
import { GroupFormFields } from "@/components/features/GroupFormFields";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

const groupSchema = z.object({
  name: z.string().min(2, "Nama Kelompok minimal 2 karakter"),
  description: z.string().optional(),
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

  const [isKu, setIsKu] = useState(false);
  const [targetKu, setTargetKu] = useState("");
  const [isSchool, setIsSchool] = useState(false);
  const [schoolLevel, setSchoolLevel] = useState("");

  const { mutateAsync: addGroup, isPending } = useAddGroup();
  const { data: homebases = [] } = useHomebases();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
  });

  const onSubmit = async (data: GroupForm) => {
    if (isKu && !targetKu) { toast.error("Umur tidak boleh kosong untuk Kelompok Umur!"); return; }
    if (isSchool && !schoolLevel) { toast.error("Silakan pilih tingkat sekolah yang sesuai!"); return; }

    try {
      const descPayload = buildGroupDescriptionPayload({
        targetKu: isKu && targetKu ? parseInt(targetKu, 10) : undefined,
        schoolLevel: isSchool && schoolLevel ? schoolLevel : undefined,
      });

      await addGroup({ ...data, description: descPayload });

      reset();
      setIsKu(false); setTargetKu(""); setIsSchool(false); setSchoolLevel("");
      setOpen(false);
      toast.success("Kelompok baru berhasil ditambahkan!");
    } catch {
      toast.error("Gagal menambahkan kelompok. Coba lagi atau hubungi admin.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger
          render={
            <Button size="lg" className="w-full sm:w-auto h-10 font-semibold text-sm">
              <Plus className="mr-2 size-4" /> Tambah Kelompok
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
            isKu={isKu}
            setIsKu={setIsKu}
            targetKu={targetKu}
            setTargetKu={setTargetKu}
            isSchool={isSchool}
            setIsSchool={setIsSchool}
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
