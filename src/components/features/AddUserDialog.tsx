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
          <Button size="lg" className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
            <Plus className="mr-2 size-4" /> Tambah {isParent ? "Orang Tua" : "Admin"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <UserPlus className="size-5 text-primary" /> Buat Akun {isParent ? "Orang Tua" : "Admin"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isParent ? "Akun ini nantinya digunakan orang tua pemain untuk masuk ke aplikasi." : "Akun ini akan memiliki hak akses penuh ke panel admin Adora."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label htmlFor="user-name" className="ml-1 text-xs font-medium text-muted-foreground">Nama Lengkap</label>
            <Input id="user-name" {...register("name")} placeholder="Contoh: Budi Santoso" className="h-11 bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary/50" />
            {errors.name && <p className="ml-1 mt-1 text-xs font-medium text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="user-username" className="ml-1 text-xs font-medium text-muted-foreground">Username Login</label>
            <Input id="user-username" {...register("username")} placeholder="Contoh: budi_santoso" className="h-11 bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary/50" />
            {errors.username && <p className="ml-1 mt-1 text-xs font-medium text-destructive">{errors.username.message}</p>}
          </div>



          <div className="space-y-1.5">
            <label htmlFor="user-password" className="ml-1 text-xs font-medium text-muted-foreground">Kata Sandi {isParent ? "Awal" : "Admin"}</label>
            {isParent ? (
              <div onClick={() => toast.info("Kata sandi awal orang tua mengikuti pengaturan default sistem.")} className="cursor-not-allowed">
                <Input id="user-password" value="Mengikuti Default Sistem" readOnly tabIndex={-1} className="h-11 bg-background/50 font-mono opacity-80 pointer-events-none text-muted-foreground rounded-xl border-border/50 text-xs" />
              </div>
            ) : (
              <Input id="user-password" {...register("password")} type="text" className="h-11 bg-background/50 font-mono rounded-xl border-border/50 focus-visible:ring-primary/50" />
            )}
            <p className="ml-1 mt-0.5 text-xs text-muted-foreground">
              {isParent ? "*Sandi default diatur secara aman oleh sistem. Beritahu orang tua untuk segera menggantinya setelah login." : "*Admin dapat membuat password mereka sendiri di sini."}
            </p>
            {errors.password && !isParent && <p className="ml-1 mt-1 text-xs font-medium text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isPending} className="mt-4 h-11 w-full rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
            {isPending ? <><Loader2 className="animate-spin size-4 mr-2" /> Menyimpan...</> : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
