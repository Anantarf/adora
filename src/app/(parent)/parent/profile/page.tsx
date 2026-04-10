"use client";

import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateSelf } from "@/hooks/use-users";
import { motion } from "framer-motion";
import { 
  UserCircle, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Save, 
  Loader2, 
  Settings2,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

/**
 * ADORA Basketball - Member Profile Management (Parent Side)
 * High-definition settings view with GPU-accelerated micro-animations.
 */

const profileSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  newPassword: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const { mutateAsync: updateSelf, isPending } = useUpdateSelf();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      newPassword: "",
    }
  });

  // Sync initial data when session loads
  useEffect(() => {
    if (session?.user) {
      reset({
        name: session.user.name || "",
        email: session.user.email || "",
        newPassword: "",
      });
    }
  }, [session, reset]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateSelf({
        name: data.name,
        email: data.email || undefined,
        password: data.newPassword || undefined,
      });
      
      // Update NextAuth local session data (if provider supports it)
      await updateSession();
      reset({ ...data, newPassword: "" });
    } catch {
      // Error handled by toast
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto flex flex-col gap-10"
    >
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
          <Settings2 className="size-3.5" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pengaturan Akun</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-heading text-secondary uppercase tracking-widest italic">Profil Saya</h1>
        <p className="text-sm text-muted-foreground font-medium max-w-md">
          Kelola informasi identitas dan keamanan akun Anda untuk akses Portal Keluarga Adora.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 relative z-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-card p-8 md:p-10 rounded-[3rem] border-white/20 shadow-2xl relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {/* Identity Info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
                    <UserCircle className="size-3 text-primary" /> Nama Lengkap
                  </label>
                  <Input 
                    {...register("name")}
                    className="h-12 bg-background/40 border-border/50 rounded-2xl focus:ring-primary/20 transition-all font-semibold" 
                  />
                  {errors.name && <p className="text-[10px] text-destructive font-bold uppercase ml-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
                    <Mail className="size-3 text-primary" /> Alamat Email
                  </label>
                  <Input 
                    {...register("email")}
                    className="h-12 bg-background/40 border-border/50 rounded-2xl focus:ring-primary/20 transition-all font-semibold" 
                  />
                  {errors.email && <p className="text-[10px] text-destructive font-bold uppercase ml-1">{errors.email.message}</p>}
                </div>
              </div>

              {/* Security Info */}
              <div className="space-y-6">
                 <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
                    <Lock className="size-3 text-primary" /> Ganti Kata Sandi
                  </label>
                  <Input 
                    type="password"
                    {...register("newPassword")}
                    placeholder="Minimal 6 karakter..."
                    className="h-12 bg-background/40 border-border/50 rounded-2xl focus:ring-primary/20 transition-all font-semibold placeholder:font-medium placeholder:text-[10px]" 
                  />
                  {errors.newPassword && <p className="text-[10px] text-destructive font-bold uppercase ml-1">{errors.newPassword.message}</p>}
                  <p className="text-[9px] text-muted-foreground italic ml-1 leading-tight">
                    * Kosongkan jika tidak ingin mengubah password.
                  </p>
                </div>

                <div className="p-4 rounded-3xl bg-secondary/5 border border-primary/10 flex items-start gap-4">
                  <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Enkripsi Keamanan</p>
                    <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">
                      Data login Anda dilindungi dengan enkripsi standar industri (BCrypt v10).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/20">
              <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                 <AlertCircle className="size-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Login Username: <strong>@{session?.user?.username}</strong></span>
              </div>
              <Button 
                type="submit" 
                disabled={isPending || !isDirty}
                className="w-full md:w-auto px-10 h-12 bg-primary text-primary-foreground font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all rounded-2xl disabled:opacity-30"
              >
                {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Save className="size-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </div>
          </Card>
        </form>

        <footer className="px-8 py-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex items-center justify-center gap-4 text-center">
           <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
             <AlertCircle className="size-4" />
           </div>
           <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest leading-relaxed">
             Pastikan email aktif untuk menerima notifikasi sistem di masa mendatang.
           </p>
        </footer>
      </div>
    </motion.div>
  );
}
