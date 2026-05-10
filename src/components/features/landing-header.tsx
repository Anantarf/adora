"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants/navigation";
import { CONTACT } from "@/lib/constants/contact";

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

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-page-dark/90 backdrop-blur-xl">
      <div className="container relative mx-auto px-4 h-[72px] flex items-center justify-between">
        <Link href="/" aria-label="ADORA Basketball Club — ke atas halaman" className="flex items-center gap-3 group z-10">
          <div className="w-12 h-12 flex items-center justify-center transition-all group-hover:scale-105">
            <Image src="/logo-new.png" alt="Adora BBC Logo" width={48} height={48} className="w-auto h-auto object-contain" priority />
          </div>
          <div className="flex flex-col justify-center hidden sm:flex">
            <span className="font-heading font-black text-xl tracking-widest uppercase text-white group-hover:text-brand-yellow transition-colors leading-none mt-1 italic">
              ADORA <span className="text-brand-orange">BBC</span>
            </span>
          </div>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} className="font-heading font-black italic uppercase tracking-widest text-xs text-white/70 hover:text-brand-yellow transition-colors">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="skew-box bg-white/10 border-2 border-white/20 text-white px-4 py-1.5 md:px-5 md:py-2 hover:bg-brand-yellow hover:text-black hover:border-black transition-all shadow-none hover:shadow-[4px_4px_0px_#000] group">
            <span className="unskew-content block font-heading font-black italic text-[10px] md:text-xs tracking-widest uppercase">
              PORTAL LOGIN
            </span>
          </Link>
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            onClick={() => setOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      <div 
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div
        className={`fixed top-0 right-0 h-full w-72 bg-surface-dark border-l-4 border-brand-orange z-50 md:hidden flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <span className="font-heading font-black italic text-lg tracking-widest uppercase text-brand-yellow">MENU</span>
          <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col p-6 flex-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="font-heading font-black italic uppercase tracking-widest text-lg text-white hover:text-brand-yellow py-4 border-b border-white/10 transition-colors"
            >
              {label}
            </a>
          ))}
          <Link
            href="/login"
            className="mt-8 skew-box bg-white/10 border-2 border-white/20 text-white px-5 py-3 hover:bg-brand-yellow hover:text-black hover:border-black transition-all shadow-none hover:shadow-[4px_4px_0px_#000] text-center group"
          >
            <span className="unskew-content block font-heading font-black italic text-xs tracking-widest uppercase">
              PORTAL LOGIN
            </span>
          </Link>
        </nav>

        <div className="px-6 pb-8 flex gap-4">
          <a
            href={`https://instagram.com/${CONTACT.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram ADORA BBC"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-black hover:bg-brand-yellow hover:border-black transition-colors shadow-lg"
          >
            <InstagramIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

export { InstagramIcon };
