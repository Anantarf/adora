"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateSelf } from "@/hooks/use-users";
import { Lock, ShieldCheck, Save, Loader2, User } from "lucide-react";
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

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
    username: string;
  };
  onSuccess?: () => void;
}

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const { update: updateSession } = useSession();
  const { mutateAsync: updateSelf, isPending } = useUpdateSelf();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
      newPassword: "",
      confirmPassword: "",
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateSelf({
        name: data.name,
        email: data.email || undefined,
        password: data.newPassword || undefined,
      });
      
      await updateSession();
      reset({ ...data, newPassword: "", confirmPassword: "" });
      onSuccess?.();
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Bagian Identitas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <User className="size-4 text-primary" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Data Identitas</h2>
          </div>

          <div className="space-y-2">
            <label htmlFor="field-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Nama Lengkap
            </label>
            <Input
              id="field-name"
              {...register("name")}
              className="h-10 bg-background"
              placeholder="Masukkan nama lengkap"
            />
            {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="field-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Alamat Email
            </label>
            <Input
              id="field-email"
              {...register("email")}
              className="h-10 bg-background"
              placeholder="contoh@email.com"
            />
            {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
          </div>
        </div>

        {/* Bagian Keamanan */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Lock className="size-4 text-primary" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Keamanan Akun</h2>
          </div>

          <div className="space-y-2">
            <label htmlFor="field-new-password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Kata Sandi Baru
            </label>
            <Input
              id="field-new-password"
              type="password"
              {...register("newPassword")}
              placeholder="Minimal 6 karakter"
              className="h-10 bg-background"
            />
            {errors.newPassword && <p className="text-xs text-destructive font-medium">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="field-confirm-password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Konfirmasi Sandi
            </label>
            <Input
              id="field-confirm-password"
              type="password"
              {...register("confirmPassword")}
              placeholder="Ketik ulang kata sandi baru"
              className="h-10 bg-background"
            />
            {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex flex-col gap-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground bg-secondary/10 px-3 py-2 rounded-lg border border-border/50">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>Username: <strong className="text-foreground">{initialData.username}</strong></span>
        </div>
        
        <Button
          type="submit"
          disabled={isPending || !isDirty}
          className="w-full font-bold uppercase tracking-widest"
        >
          {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Save className="size-4 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}
