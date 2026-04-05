"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddPlayer } from "@/hooks/use-players";
import { useGroups } from "@/hooks/use-groups";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { BatchPlayerUpload } from "@/components/features/BatchPlayerUpload";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

// Schema Sinkron dengan MySQL/Prisma
const playerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  dateOfBirth: z.string().nonempty("TTL wajib diisi"),
  schoolOrigin: z.string().min(3, "Asal Sekolah minimal 3 karakter"),
  groupId: z.string().nonempty("Grup wajib dipilih"),
});

type PlayerForm = z.infer<typeof playerSchema>;

export function AddPlayerDialog() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const { data: groups, isLoading: isGroupsLoading } = useGroups();
  const { mutateAsync: addPlayer, isPending } = useAddPlayer();

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
  });

  const onSubmit = async (data: PlayerForm) => {
    try {
      const userId = (session?.user as any)?.id;
      if (!userId) {
        throw new Error("Sesi tidak valid. Silakan login kembali.");
      }

      // Kirim data ke MySQL via Server Action
      await addPlayer({
        ...data,
        parentId: (session?.user as any)?.id ?? "", 
      });
      
      reset();
      setOpen(false);
      toast.success("Atlet baru berhasil didaftarkan ke MySQL!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan tak dikenal.";
      toast.error("Gagal menambahkan pemain: " + msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button size="lg" className="w-full sm:w-auto uppercase font-bold tracking-widest text-xs h-11">
            <Plus className="mr-2 size-4" /> Tambah Atlet
          </Button>
        } 
      />

      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase text-foreground tracking-widest">Registrasi Atlet Baru</DialogTitle>
          <DialogDescription className="text-sm font-medium tracking-wide">
            Masukkan data atlet ke dalam database MySQL Adora.
          </DialogDescription>
        </DialogHeader>

        {isBatchMode ? (
          <div className="pt-4">
             <BatchPlayerUpload onDone={() => setOpen(false)} />
             <Button variant="ghost" className="w-full mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground" onClick={() => setIsBatchMode(false)}>
               Kembali ke Input Manual
             </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
               <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Nama Lengkap</label>
              <Input {...register("name")} placeholder="Contoh: Dimas Anggara" className="h-11" />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
               <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Tanggal Lahir (YYYY-MM-DD)</label>
              <Input type="date" {...register("dateOfBirth")} className="h-11" />
              {errors.dateOfBirth && <p className="text-destructive text-xs">{errors.dateOfBirth.message}</p>}
            </div>

            <div className="space-y-2">
               <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Asal Sekolah</label>
              <Input {...register("schoolOrigin")} placeholder="Contoh: SMA Gonzaga" className="h-11" />
              {errors.schoolOrigin && <p className="text-destructive text-xs">{errors.schoolOrigin.message}</p>}
            </div>

            <div className="space-y-2">
               <label className="text-[10px] uppercase font-medium tracking-widest text-muted-foreground">Grup Latihan</label>
              <Select onValueChange={(val: string | null) => { if (val) setValue("groupId", val); }} disabled={isGroupsLoading}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={isGroupsLoading ? "Memuat..." : "Pilih Grup"} />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.groupId && <p className="text-destructive text-xs">{errors.groupId.message}</p>}
            </div>

            <div className="pt-4 flex flex-col gap-2 w-full justify-end">
              <Button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/90 h-11 text-primary-foreground font-bold tracking-widest uppercase">
                {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                Simpan Data Manual
              </Button>
              <Button type="button" variant="ghost" className="w-full text-xs font-bold tracking-widest uppercase text-muted-foreground" onClick={() => setIsBatchMode(true)}>
                Gunakan Mode Batch (CSV)
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
