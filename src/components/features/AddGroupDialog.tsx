"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddGroup } from "@/hooks/use-groups";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

const groupSchema = z.object({
  name: z.string().min(2, "Nama Grup minimal 2 karakter"),
  description: z.string().optional(),
});

type GroupForm = z.infer<typeof groupSchema>;

export function AddGroupDialog() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: addGroup, isPending } = useAddGroup();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
  });

  const onSubmit = async (data: GroupForm) => {
    try {
      await addGroup(data);
      reset();
      setOpen(false);
      toast.success("Grup baru berhasil ditambahkan!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan tak dikenal.";
      toast.error("Gagal menambahkan grup: " + msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button size="lg" className="w-full sm:w-auto uppercase font-bold tracking-widest text-xs h-11">
            <Plus className="mr-2 size-4" /> Tambah Grup
          </Button>
        } 
      />

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase text-foreground tracking-widest">Buka Grup Baru</DialogTitle>
          <DialogDescription className="text-sm font-medium tracking-wide">
            Masukkan rincian grup latihan untuk memisahkan Batch / Kategori usia siswa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="group_name" className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground cursor-pointer">Nama Spesifik (Wajib Unik)</label>
            <Input id="group_name" {...register("name")} placeholder="Contoh: U-16 Roasters" className="h-11" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="group_desc" className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground cursor-pointer">Persyaratan Kelas (Opsional)</label>
            <Input id="group_desc" {...register("description")} placeholder="Contoh: Min. umur 15 thn" className="h-11" />
          </div>

          <div className="pt-4 flex w-full justify-end">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto font-bold uppercase tracking-widest text-xs h-11">
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
              Simpan Data Grup
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
