"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { 
  Trophy, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(5, "Sandi minimal 5 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    
    try {
      const result = await signIn("credentials", {
        redirect: true,
        callbackUrl: "/api/auth/callback/credentials", // Temporary, logic handles in middleware or server component redirect generally
        username: data.username,
        password: data.password,
      });

      if (result?.error) {
        toast.error("Gagal Masuk", {
          description: result.error || "Username atau sandi salah.",
          icon: <AlertCircle className="size-4" />
        });
      } else {
        toast.success("Login Berhasil", {
          description: "Selamat datang kembali!",
          icon: <ShieldCheck className="size-4" />
        });
      }
    } catch (err) {
      toast.error("Sistem Bermasalah", {
        description: "Terjadi kesalahan pada server. Coba lagi nanti."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center size-16 bg-gradient-to-tr from-primary to-primary/60 rounded-2xl mb-4 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
              <Trophy className="size-10 text-white animate-bounce-subtle" />
            </div>
            <h1 className="text-4xl font-heading text-white tracking-[0.2em] uppercase mb-2">
              Adora <span className="text-primary">Cloud</span>
            </h1>
            <p className="text-white/50 font-medium text-[10px] uppercase tracking-widest">
              Sistem Manajemen Klub Bola Basket Eksklusif
            </p>
          </div>

          {/* Form Login */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-[0.2em] ml-1">
                  Identitas Pengguna
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="size-5 text-white/30 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    {...register("username")}
                    type="text"
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all disabled:opacity-50"
                    placeholder="Contoh: admin"
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-red-400 mt-1 ml-1">{errors.username.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-[0.2em] ml-1">
                  Kunci Sandi
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="size-5 text-white/30 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    {...register("password")}
                    type="password"
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1 ml-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Login Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all group disabled:opacity-70 uppercase tracking-widest text-xs"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  Masuk Ke Dashboard
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>

            {/* Footer Links */}
            <div className="text-center pt-2">
              <p className="text-white/30 text-xs font-medium">
                Masalah akses? Hubungi admin sistem.
              </p>
            </div>
          </form>
        </div>
      </motion.div>
  );
}
