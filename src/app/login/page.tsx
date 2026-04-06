import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0d0d0d] px-4">
      <Starfield />
      <LoginForm />
    </main>
  );
}
