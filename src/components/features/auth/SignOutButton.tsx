"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };
  return (
    <button 
      onClick={handleSignOut}
      className="group flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground hover:text-primary transition-all hover:bg-primary/5 px-4 py-2.5 rounded-xl uppercase border border-transparent hover:border-primary/20"
    >
      <span className="hidden sm:inline">Keluar Sesi</span>
      <LogOut className="size-4 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
