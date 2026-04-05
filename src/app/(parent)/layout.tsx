"use client";

import { CopySlash, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AuthGuard } from "@/components/providers/auth-guard";

/**
 * Layout Khusus Portal Orang Tua (Parent Portal)
 * Terintegrasi dengan MySQL Login (NextAuth) dan Proyeksi Bebas Supabase.
 */
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };
  
  return (
    <AuthGuard>
      <div className="flex relative w-full flex-col min-h-[100dvh] bg-background selection:bg-primary/20 animate-in fade-in duration-700">
        
        {/* Navigation Bar - Glassmorphism Style */}
        <header className="flex h-20 w-full shrink-0 items-center justify-between border-b border-border/40 px-6 md:px-12 sticky top-0 bg-background/60 backdrop-blur-xl z-50 transition-all">
          <div className="flex items-center gap-4 group">
             <div className="flex aspect-square size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(var(--primary-rgb),0.3)] group-hover:scale-105 transition-transform duration-300">
               <CopySlash className="size-6 animate-bounce-subtle" />
             </div>
             <div className="flex flex-col gap-0.5 leading-none">
               <span className="font-heading text-2xl md:text-3xl tracking-widest text-secondary uppercase italic">ADORA <span className="text-primary not-italic">FAM</span></span>
               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.35em] ml-0.5">Family Portal</span>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <button 
               onClick={handleSignOut}
               className="group flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground hover:text-primary transition-all hover:bg-primary/5 px-4 py-2.5 rounded-xl uppercase border border-transparent hover:border-primary/20"
             >
               <span className="hidden sm:inline">Keluar Sesi</span>
               <LogOut className="size-4 group-hover:translate-x-0.5 transition-transform" />
             </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="w-full flex-1 mx-auto max-w-[1300px] p-6 lg:p-10">
          <div className="w-full animate-in slide-in-from-bottom-4 duration-1000 ease-out fill-mode-both">
            {children}
          </div>
        </main>
        
        {/* Simple Footer Decoration */}
        <footer className="p-8 text-center border-t border-border/20">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted-foreground/30 italic">
            Adora Basketball Club &copy; 2026
          </p>
        </footer>
      </div>
    </AuthGuard>
  )
}
