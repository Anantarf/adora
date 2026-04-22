"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateSelf } from "@/hooks/use-users";
import { Lock, ShieldCheck, Save, Loader2, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

const profileSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  newPassword: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Konfirmasi kata sandi tidak cocok",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
    username: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const { update: updateSession } = useSession();
  const { mutateAsync: updateSelf, isPending } = useUpdateSelf();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      newPassword: "",
      confirmPassword: "",
    }
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateSelf({
        name: data.name,
        email: data.email || undefined,
        password: data.newPassword || undefined,
      });
      
      await updateSession();
      reset({ ...data, newPassword: "", confirmPassword: "" });
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-heading text-foreground uppercase">Profil Saya</h1>
        <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
          Kelola informasi identitas dan keamanan akun Anda untuk mengakses layanan Portal Keluarga.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 md:p-8 bg-card border-border shadow-sm rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {/* Bagian Identitas */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <User className="size-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">Data Identitas</h2>
              </div>

              <div className="space-y-3">
                <label htmlFor="field-name" className="text-sm font-medium text-foreground">
                  Nama Lengkap
                </label>
                <Input
                  id="field-name"
                  {...register("name")}
                  className="h-11 bg-background"
                  placeholder="Masukkan nama lengkap"
                />
                {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
              </div>

              <div className="space-y-3">
                <label htmlFor="field-email" className="text-sm font-medium text-foreground">
                  Alamat Email
                </label>
                <Input
                  id="field-email"
                  {...register("email")}
                  className="h-11 bg-background"
                  placeholder="contoh@email.com"
                />
                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
              </div>
            </div>

            {/* Bagian Keamanan */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Lock className="size-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">Keamanan Akun</h2>
              </div>

              <div className="space-y-3">
                <label htmlFor="field-new-password" className="text-sm font-medium text-foreground">
                  Kata Sandi Baru
                </label>
                <Input
                  id="field-new-password"
                  type="password"
                  {...register("newPassword")}
                  placeholder="Minimal 6 karakter"
                  className="h-11 bg-background"
                />
                {errors.newPassword && <p className="text-xs text-destructive font-medium">{errors.newPassword.message}</p>}
              </div>

              <div className="space-y-3">
                <label htmlFor="field-confirm-password" className="text-sm font-medium text-foreground">
                  Ulangi Kata Sandi Baru
                </label>
                <Input
                  id="field-confirm-password"
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="Ketik ulang kata sandi baru"
                  className="h-11 bg-background"
                />
                {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>}
                <p className="text-xs text-muted-foreground pt-1">
                  * Kosongkan kedua kolom sandi jika tidak ingin mengubah kata sandi.
                </p>
              </div>
            </div>
          </div>

          {/* Info & Submit */}
          <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/20 px-4 py-2.5 rounded-lg border border-border/50 w-full md:w-auto">
              <ShieldCheck className="size-4 text-primary" />
              <span>Nama Pengguna untuk Login: <strong className="text-foreground">@{initialData.username}</strong></span>
            </div>
            
            <Button 
              type="submit" 
              disabled={isPending || !isDirty}
              className="w-full md:w-auto h-11 px-8 rounded-lg font-semibold"
            >
              {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Save className="size-4 mr-2" />}
              Simpan Perubahan
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
