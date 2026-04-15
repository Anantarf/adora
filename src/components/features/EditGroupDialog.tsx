"use client";

import { useEffect } from "react";
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
import { Edit2, Loader2 } from "lucide-react";

const HOMEBASE_NONE = "__none__";

const groupSchema = z.object({
  name:        z.string().min(2, "Nama Grup minimal 2 karakter"),
  description: z.string().optional(),
  homebaseId:  z.string().optional(),
});

type GroupForm = z.infer<typeof groupSchema>;

interface EditGroupDialogProps {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGroupDialog({ group, open, onOpenChange }: EditGroupDialogProps) {
  const { mutateAsync: updateGroup, isPending } = useUpdateGroup();
  const { data: homebases = [] }                = useHomebases();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } =
    useForm<GroupForm>({
      resolver: zodResolver(groupSchema),
      defaultValues: {
        name:        group.name,
        description: group.description || "",
        homebaseId:  group.homebase?.id,
      },
    });

  useEffect(() => {
    if (open) {
      reset({
        name:        group.name,
        description: group.description || "",
        homebaseId:  group.homebase?.id,
      });
    }
  }, [group, open, reset]);

  const onSubmit = async (data: GroupForm) => {
    try {
      await updateGroup({
        id: group.id,
        data: {
          name:        data.name,
          description: data.description ?? "",
          homebaseId:  data.homebaseId || null,
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
            Ubah Grup
          </DialogTitle>
          <DialogDescription className="text-xs font-medium tracking-wide">Update nama, deskripsi, atau homebase grup latihan.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="group_name" className="text-xs uppercase font-semibold tracking-widest text-muted-foreground cursor-pointer">
              Nama Grup (Wajib Unik)
            </label>
            <Input id="group_name" {...register("name")} placeholder="Contoh: U-16 Roasters" className="h-11" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="group_desc" className="text-xs uppercase font-semibold tracking-widest text-muted-foreground cursor-pointer">
              Persyaratan Kelas (Opsional)
            </label>
            <Input id="group_desc" {...register("description")} placeholder="Contoh: Min. umur 15 thn" className="h-11" />
          </div>

          {homebases.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">
                Homebase
              </label>
              <Select
                value={watch("homebaseId") ?? HOMEBASE_NONE}
                onValueChange={(val) => setValue("homebaseId", !val || val === HOMEBASE_NONE ? undefined : val)}
              >
                <SelectTrigger className="h-11 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={HOMEBASE_NONE} className="text-muted-foreground">— Tanpa Homebase —</SelectItem>
                  {homebases.map((hb) => (
                    <SelectItem key={hb.id} value={hb.id}>{hb.name}</SelectItem>
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
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
