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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-page-dark px-4 pt-20 pb-6 sm:py-6">
      <Starfield />
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 skew-box bg-white/10 border-2 border-white/20 text-white px-4 py-2 hover:bg-brand-yellow hover:text-black hover:border-black transition-all shadow-none hover:shadow-[4px_4px_0px_#000] group"
      >
        <span className="unskew-content flex items-center gap-2 font-heading font-black italic text-[10px] md:text-xs tracking-widest uppercase">
          <ArrowLeft className="size-4" />
          KEMBALI KE BERANDA
        </span>
      </Link>
      <LoginForm />
    </main>
  );
}
