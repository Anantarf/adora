import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/features/auth/login-form";
import { Starfield } from "@/components/ui/starfield";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // Already logged in → redirect to the correct portal
  if (session?.user) {
    const role = session.user.role;
    redirect(role === "ADMIN" ? "/dashboard" : "/parent");
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-page-dark px-4">
      <Starfield />
      <Link href="/" className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors">
        <ArrowLeft className="size-4" />
        Kembali ke Beranda
      </Link>
      <LoginForm />
    </main>
  );
}
