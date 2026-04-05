import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/auth/login-form";

export default async function RootLoginPage() {
  const session = await getServerSession(authOptions);

  // Server-side redirection: 100% Lean & No Layout Flash
  if (session?.user) {
    const role = (session.user as any).role;
    redirect(role === "ADMIN" ? "/dashboard" : "/parent");
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0d0d0d] px-4">
      {/* Dynamic Background (Server Rendered Structure) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <LoginForm />
    </main>
  );
}
