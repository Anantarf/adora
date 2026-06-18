"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants/navigation";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  const closeDrawer = useCallback(() => setOpen(false), []);

  // Escape key closes drawer
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeDrawer]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-page-dark/95 backdrop-blur-xl">
        <div className="container relative mx-auto px-4 md:px-4 h-18 flex items-center justify-between">
          <Link href="/" aria-label="ADORA Basketball Club — ke atas halaman" className="flex items-center gap-3 group z-10">
            <div className="w-12 h-12 flex items-center justify-center transition-all group-hover:scale-105">
              <Image src="/logo-new.svg" alt="Adora BBC Logo" width={48} height={48} className="w-auto h-auto object-contain" />
            </div>
            <div className="flex flex-col justify-center hidden sm:flex">
              <span className="font-heading font-black text-xl tracking-widest uppercase text-white group-hover:text-brand-yellow transition-colors leading-none mt-1 italic">
                ADORA <span className="text-brand-orange">BBC</span>
              </span>
            </div>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href} className="inline-flex min-h-10 items-center font-heading font-black italic uppercase tracking-widest text-xs text-white/70 hover:text-brand-yellow transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="skew-box inline-flex min-h-11 items-center bg-white/15 border-2 border-white/30 text-white px-4 py-1.5 md:px-5 md:py-2 hover:bg-brand-yellow hover:text-black hover:border-black transition-all shadow-none hover:shadow-[4px_4px_0px_#000] group"
            >
              <span className="unskew-content block font-heading font-black italic text-[10px] md:text-xs tracking-widest uppercase">PORTAL LOGIN</span>
            </Link>
            <button
              className="md:hidden min-w-11 min-h-11 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              onClick={() => setOpen(true)}
              aria-label="Buka menu navigasi"
              aria-expanded={open}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closeDrawer}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-black border-l-4 border-brand-orange z-[70] md:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/10">
          <span className="font-heading font-black italic text-xs tracking-widest uppercase text-brand-yellow">MENU</span>
          <button
            onClick={closeDrawer}
            aria-label="Tutup menu"
            className="min-w-11 min-h-11 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex flex-col p-4">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={closeDrawer}
              className="font-heading font-black italic uppercase tracking-[0.2em] text-xs text-white hover:text-brand-yellow py-2.5 transition-all flex items-center justify-between group min-h-11"
            >
              {label}
              <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-brand-orange text-[10px]">→</span>
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}

export { InstagramIcon };
