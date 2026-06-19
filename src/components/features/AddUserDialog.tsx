"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddUser } from "@/hooks/use-users";
import { toast } from "sonner";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

function buildUserSchema(role: ManagedUserRole) {
  const requirePassword = role !== "PARENT";
  return z.object({
    name: z.string().min(1, "Nama tidak boleh kosong"),
    username: z
      .string()
      .min(4, "Username minimal 4 karakter")
      .regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, dan underscore"),
    email: z.string().email("Email tidak valid").optional().or(z.literal("")),
    password: requirePassword
      ? z.string().min(6, `Password ${role === "COACH" ? "coach" : "admin"} minimal 6 karakter.`)
      : z.string().optional(),
  });
}

type UserForm = z.infer<ReturnType<typeof buildUserSchema>>;

type ManagedUserRole = "PARENT" | "ADMIN" | "COACH";

export function AddUserDialog({ role = "PARENT" }: { role?: ManagedUserRole }) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: addUser, isPending } = useAddUser();

  const isParent = role === "PARENT";
  const isCoach = role === "COACH";
  const titleLabel = isParent ? "Orang Tua" : isCoach ? "Coach" : "Admin";
  const passwordLabel = isParent ? "Kata Sandi Awal" : isCoach ? "Kata Sandi Coach" : "Kata Sandi Admin";
  const description = isParent
    ? "Akun ini nantinya digunakan orang tua pemain untuk masuk ke aplikasi."
    : isCoach
      ? "Akun ini disiapkan untuk coach dan akan dihubungkan ke profil coach pada pengelolaan akun."
      : "Akun ini akan memiliki hak akses penuh ke panel admin Adora.";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserForm>({
    resolver: zodResolver(buildUserSchema(role)),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },

  });

  const onSubmit = async (data: UserForm) => {
    try {
      await addUser({
        name: data.name,
        username: data.username,
        email: data.email || undefined,
        password: isParent ? undefined : data.password,
        role: role,
      });
      toast.success(`Akun ${titleLabel.toLowerCase()} berhasil dibuat.`);
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
          <Button size="lg" className="h-11">
            <Plus className="mr-2 size-4" /> Tambah {titleLabel}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <UserPlus className="size-5 text-primary" /> Buat Akun {titleLabel}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-name" className="ml-1 text-xs font-medium text-muted-foreground">Nama Lengkap</Label>
            <Input id="user-name" {...register("name")} placeholder="Contoh: Budi Santoso" aria-required="true" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "user-name-error" : undefined} className="h-11 bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary/50" />
            {errors.name && <p id="user-name-error" role="alert" className="ml-1 mt-1 text-xs font-medium text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-username" className="ml-1 text-xs font-medium text-muted-foreground">Username Login</Label>
            <Input id="user-username" {...register("username")} placeholder="Contoh: budi_santoso" aria-required="true" aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? "user-username-error" : undefined} className="h-11 bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary/50" />
            {errors.username && <p id="user-username-error" role="alert" className="ml-1 mt-1 text-xs font-medium text-destructive">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email" className="ml-1 text-xs font-medium text-muted-foreground">Email</Label>
            <Input id="user-email" {...register("email")} type="email" placeholder="opsional@contoh.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "user-email-error" : undefined} className="h-11 bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary/50" />
            {errors.email && <p id="user-email-error" role="alert" className="ml-1 mt-1 text-xs font-medium text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password" className="ml-1 text-xs font-medium text-muted-foreground">{passwordLabel}</Label>
            {isParent ? (
              <div onClick={() => toast.info("Kata sandi awal orang tua mengikuti pengaturan default sistem.")} className="cursor-not-allowed">
                <Input id="user-password" value="Mengikuti Default Sistem" readOnly tabIndex={-1} className="h-11 bg-background/50 font-mono opacity-80 pointer-events-none text-muted-foreground rounded-xl border-border/50 text-xs" />
              </div>
            ) : (
              <Input id="user-password" {...register("password")} type="password" aria-required="true" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "user-password-error" : undefined} className="h-11 bg-background/50 font-mono rounded-xl border-border/50 focus-visible:ring-primary/50" />
            )}
            <p className="ml-1 mt-0.5 text-xs text-muted-foreground">
              {isParent
                ? "*Sandi default diatur secara aman oleh sistem. Beritahu orang tua untuk segera menggantinya setelah login."
                : isCoach
                  ? "*Coach akan memakai kata sandi ini saat portal coach diaktifkan."
                  : "*Admin dapat membuat password mereka sendiri di sini."}
            </p>
            {errors.password && !isParent && <p id="user-password-error" role="alert" className="ml-1 mt-1 text-xs font-medium text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isPending} className="mt-4 h-11 w-full rounded-xl shadow-sm">
            {isPending ? <><Loader2 className="animate-spin size-4 mr-2" /> Menyimpan...</> : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
