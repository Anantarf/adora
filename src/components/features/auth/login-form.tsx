"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Lock, User, ArrowRight, Loader2, ShieldCheck, AlertCircle, Cone, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(5, "Kata sandi minimal 5 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: data.username,
        password: data.password,
      });

      if (result?.error) {
        toast.error("Gagal masuk", {
          description: result.error || "Username atau kata sandi tidak sesuai.",
          icon: <AlertCircle className="size-4" />,
        });
      } else {
        toast.success("Masuk berhasil", {
          description: "Anda akan diarahkan ke portal sesuai akses.",
          icon: <ShieldCheck className="size-4" />,
        });
        // Fetch fresh session to read role, then navigate to the correct portal
        const session = await getSession();
        const role = (session?.user as { role?: string })?.role;
        router.push(role === "ADMIN" ? "/dashboard" : "/parent");
      }
    } catch (err) {
      toast.error("Terjadi gangguan sistem", {
        description: "Silakan coba kembali beberapa saat lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-120 z-10">
      <div className="bg-login-card/95 border border-white/10 rounded-3xl px-7 py-8 shadow-login-card sm:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-15 bg-login-icon rounded-2xl mb-5 shadow-sm">
            <Cone className="size-9 text-white" strokeWidth={2.1} />
          </div>
          <h1 className="text-white font-heading uppercase tracking-widest leading-none">
            <span className="block text-[34px]">Adora</span>
            <span className="block text-[22px] mt-1.5 text-white/85">Basketball Club</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="size-5 text-white/30 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  {...register("username")}
                  type="text"
                  disabled={loading}
                  className="w-full bg-login-input border border-white/12 rounded-2xl py-4 pl-14 pr-5 text-white placeholder:text-white/22 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all disabled:opacity-50 [&:-webkit-autofill]:[transition:background-color_9999999s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                  placeholder="Masukkan username"
                />
              </div>
              {errors.username && <p className="text-xs text-red-400 mt-1 ml-1">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50 ml-1">Kata Sandi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="size-5 text-white/30 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  disabled={loading}
                  className="w-full bg-login-input border border-white/12 rounded-2xl py-4 pl-14 pr-14 text-white placeholder:text-white/22 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all disabled:opacity-50 [&:-webkit-autofill]:[transition:background-color_9999999s] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-white/35 hover:text-white focus:outline-none transition-colors">
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1 ml-1">{errors.password.message}</p>}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest text-xl uppercase shadow-login-btn transition-all group disabled:opacity-70 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <span className="inline-flex items-center gap-2.5">
                MASUK
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </motion.button>

          <div className="text-center pt-1">
            <p className="text-white/45 text-sm font-medium">Kendala akses? Hubungi admin ADORA Basketball.</p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
