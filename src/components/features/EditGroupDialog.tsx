"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateGroup, type Group } from "@/hooks/use-groups";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit2, Loader2 } from "lucide-react";

const groupSchema = z.object({
  name: z.string().min(2, "Nama Grup minimal 2 karakter"),
  description: z.string().optional(),
});

type GroupForm = z.infer<typeof groupSchema>;

interface EditGroupDialogProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGroupDialog({ group, open, onOpenChange }: EditGroupDialogProps) {
  const { mutateAsync: updateGroup, isPending } = useUpdateGroup();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group.name,
      description: group.description || "",
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        name: group.name,
        description: group.description || "",
      });
    }
  }, [group, open, reset]);

  const onSubmit = async (data: GroupForm) => {
    try {
      await updateGroup({
        id: group.id,
        data: {
          name: data.name,
          ...(data.description ? { description: data.description } : { description: "" }),
        }
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
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase text-foreground tracking-widest flex items-center gap-2">
            <Edit2 className="size-5 text-primary" />
            Ubah Grup
          </DialogTitle>
          <DialogDescription className="text-sm font-medium tracking-wide">
            Update nama atau deskripsi grup latihan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="group_name" className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground cursor-pointer">
              Nama Grup (Wajib Unik)
            </label>
            <Input
              id="group_name"
              {...register("name")}
              placeholder="Contoh: U-16 Roasters"
              className="h-11"
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="group_desc" className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground cursor-pointer">
              Persyaratan Kelas (Opsional)
            </label>
            <Input
              id="group_desc"
              {...register("description")}
              placeholder="Contoh: Min. umur 15 thn"
              className="h-11"
            />
            {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
          </div>

          <div className="pt-4 flex w-full justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-11 font-bold uppercase tracking-widest text-xs"
            >
              Batalkan
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 font-bold uppercase tracking-widest text-xs"
            >
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
