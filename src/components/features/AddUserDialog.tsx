"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddUser } from "@/hooks/use-users";
import { Loader2, Plus, UserPlus } from "lucide-react";
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
import { useState } from "react";

/**
 * ADORA Basketball - Add Parent Account Dialog
 * Declarative form management with Zod + React Hook Form.
 */

const userSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  username: z.string().min(4, "Username minimal 4 karakter").regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, dan underscore"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type UserForm = z.infer<typeof userSchema>;

export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: addUser, isPending } = useAddUser();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "adora123",
    }
  });

  const onSubmit = async (data: UserForm) => {
    try {
      await addUser({
        name: data.name,
        username: data.username,
        email: data.email || undefined,
        password: data.password || "adora123",
      });
      setOpen(false);
      reset();
    } catch {
      // Error handled in hook via toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="lg" className="uppercase font-bold tracking-widest text-[10px] h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20">
            <Plus className="mr-2 size-4" /> Tambah Orang Tua
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase flex items-center gap-2">
            <UserPlus className="size-5 text-primary" /> Buat Akun Parent
          </DialogTitle>
          <DialogDescription className="text-xs font-medium tracking-wide uppercase opacity-70">
            Username dan password default ini akan digunakan untuk login Orang Tua.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Nama Lengkap Orang Tua</label>
            <Input {...register("name")} placeholder="Contoh: Bpk. Kurniawan" className="h-11 bg-background/50" />
            {errors.name && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Username Login</label>
            <Input {...register("username")} placeholder="hanya_kecil_tanpa_spasi" className="h-11 bg-background/50" />
            {errors.username && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Email <span className="opacity-50">(Opsional)</span></label>
            <Input {...register("email")} placeholder="parent@example.com" className="h-11 bg-background/50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Password Awal</label>
            <Input {...register("password")} type="text" className="h-11 bg-background/50 font-mono" />
            <p className="text-[8px] text-muted-foreground italic mt-0.5 ml-1">* Berikan password ini kepada orang tua untuk login pertama.</p>
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-11 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest uppercase text-xs">
            {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : "Buat Akun Sekarang"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
