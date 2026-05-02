"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddUser } from "@/hooks/use-users";
import { toast } from "sonner";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

/**
 * ADORA Basketball - Add Parent Account Dialog
 * Declarative form management with Zod + React Hook Form.
 */

const userSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong"),
  username: z
    .string()
    .min(4, "Username minimal 4 karakter")
    .regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, dan underscore"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  password: z.string().optional(),
});

type UserForm = z.infer<typeof userSchema>;

export function AddUserDialog({ role = "PARENT" }: { role?: "PARENT" | "ADMIN" }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: addUser, isPending } = useAddUser();

  const isParent = role === "PARENT";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },

  });

  const onSubmit = async (data: UserForm) => {
    if (!isParent && (!data.password || data.password.length < 6)) {
      toast.error("Password admin minimal 6 karakter.");
      return;
    }

    try {
      await addUser({
        name: data.name,
        username: data.username,
        email: data.email || undefined,
        password: isParent ? undefined : data.password,
        role: role,
      });
      toast.success(`Akun ${isParent ? "orang tua" : "admin"} berhasil dibuat.`);
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
          <Button size="lg" className="uppercase font-bold tracking-widest text-[10px] h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
            <Plus className="mr-2 size-4" /> Tambah {isParent ? "Orang Tua" : "Admin"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading uppercase flex items-center gap-2">
            <UserPlus className="size-5 text-primary" /> Buat Akun {isParent ? "Orang Tua" : "Admin"}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium tracking-wide opacity-70">
            {isParent ? "Akun ini nantinya digunakan orang tua pemain untuk masuk ke aplikasi." : "Akun ini akan memiliki hak akses penuh ke panel admin Adora."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Nama Lengkap</label>
            <Input {...register("name")} placeholder="Contoh: Budi Santoso" className="h-11 bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary/50" />
            {errors.name && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Username Login</label>
            <Input {...register("username")} placeholder="Contoh: budi_santoso" className="h-11 bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary/50" />
            {errors.username && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.username.message}</p>}
          </div>



          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Kata Sandi {isParent ? "Awal" : "Admin"}</label>
            {isParent ? (
              <div onClick={() => toast.info("Kata sandi awal orang tua mengikuti pengaturan default sistem.")} className="cursor-not-allowed">
                <Input value="Mengikuti Default Sistem" readOnly tabIndex={-1} className="h-11 bg-background/50 font-mono opacity-80 pointer-events-none text-muted-foreground rounded-xl border-border/50 text-xs" />
              </div>
            ) : (
              <Input {...register("password")} type="text" className="h-11 bg-background/50 font-mono rounded-xl border-border/50 focus-visible:ring-primary/50" />
            )}
            <p className="text-[10px] text-muted-foreground italic mt-0.5 ml-1">
              {isParent ? "*Sandi default diatur secara aman oleh sistem. Beritahu orang tua untuk segera menggantinya setelah login." : "*Admin dapat membuat password mereka sendiri di sini."}
            </p>
            {errors.password && !isParent && <p className="text-destructive text-[10px] font-bold uppercase ml-1 mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isPending} className="w-full h-11 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest uppercase text-xs rounded-xl shadow-sm">
            {isPending ? <><Loader2 className="animate-spin size-4 mr-2" /> Menyimpan...</> : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
