"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { LoginPasswordField, LoginUsernameField } from "@/components/features/auth/login-form-fields";
import { LoginSubmitButton } from "@/components/features/auth/login-submit-button";

const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(5, "Kata sandi minimal 5 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getPortalPathByRole(role: unknown) {
  if (role === "ADMIN" || role === "SUPERADMIN") {
    return "/dashboard";
  }

  if (role === "PARENT") {
    return "/parent";
  }

  if (role === "COACH") {
    return "/coach";
  }

  return null;
}

function getLoginErrorMessage(error?: string | null) {
  if (
    !error ||
    error === "CredentialsSignin" ||
    error === "Role akun tidak dikenali. Silakan hubungi admin." ||
    error.toLowerCase().includes("credential") ||
    error.toLowerCase().includes("username") ||
    error.toLowerCase().includes("sandi") ||
    error.toLowerCase().includes("password")
  ) {
    return "Username atau kata sandi salah.";
  }

  return error;
}

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
        toast.error("Login gagal", {
          description: getLoginErrorMessage(result.error),
          icon: <AlertCircle className="size-4" />,
        });
      } else {
        // updateSession() has a race condition, fetch directly to get the committed JWT.
        const res = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const session = await res.json();
        const role = (session?.user as { role?: string })?.role;
        const portalPath = getPortalPathByRole(role);
        if (portalPath) {
          router.push(portalPath);
          return;
        }

        await signOut({ redirect: false });
        toast.error("Login gagal", {
          description: "Username atau kata sandi salah.",
          icon: <AlertCircle className="size-4" />,
        });
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
            <Image src="/logo-adora-full.png" alt="Adora Basketball Club" width={380} height={160} className="object-contain relative z-10 mx-auto w-full h-auto max-w-95" style={{ width: "auto", height: "auto" }} preload />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <LoginUsernameField label="Username" placeholder="Masukkan username" registration={register("username")} errorMessage={errors.username?.message} disabled={loading} />

            <LoginPasswordField
              label="Kata Sandi"
              placeholder="Masukkan kata sandi"
              registration={register("password")}
              errorMessage={errors.password?.message}
              disabled={loading}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
          </div>

          <LoginSubmitButton loading={loading} />

          <div className="text-center pt-1">
            <p className="text-white/80 text-sm font-medium">Butuh bantuan? Hubungi tim kami via WhatsApp.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
