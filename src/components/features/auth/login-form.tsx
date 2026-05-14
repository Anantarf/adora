"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { LoginPasswordField, LoginUsernameField } from "@/components/features/auth/login-form-fields";
import { LoginSubmitButton } from "@/components/features/auth/login-submit-button";

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
        toast.error("Autentikasi Gagal", {
          description: result.error || "Username atau kata sandi tidak sesuai.",
          icon: <AlertCircle className="size-4" />,
        });
      } else {
        toast.success("Autentikasi Berhasil", {
          description: "Anda akan diarahkan ke portal sesuai akses.",
          icon: <ShieldCheck className="size-4" />,
        });
        // updateSession() has a race condition — fetch directly to get the committed JWT
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = (session?.user as { role?: string })?.role;
        router.push(role === "ADMIN" ? "/dashboard" : "/parent");
      }
    } catch {
      toast.error("Kesalahan Sistem", {
        description: "Silakan coba kembali beberapa saat lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-120 z-10 opacity-100 animate-in fade-in duration-500">
      <div className="bg-login-card/95 border border-white/10 rounded-3xl px-6 py-5 shadow-login-card sm:px-8">
        <div className="text-center mb-1">
          <div className="relative w-full flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            <Image src="/logo-adora-full.png" alt="Adora Basketball Club" width={380} height={160} className="object-contain relative z-10 mx-auto w-full max-w-95" style={{ width: "auto", height: "auto" }} priority fetchPriority="high" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <LoginUsernameField label="Username" placeholder="Masukkan username" registration={register("username")} errorMessage={errors.username?.message} disabled={loading} />

            <LoginPasswordField
              label="Kata Sandi"
              placeholder="••••••••"
              registration={register("password")}
              errorMessage={errors.password?.message}
              disabled={loading}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
          </div>

          <LoginSubmitButton loading={loading} />

          <div className="text-center pt-1">
            <p className="text-white/80 text-sm font-medium">Kendala akses? Hubungi admin ADORA Basketball.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
