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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-page-dark/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-[72px] flex items-center justify-between">
        <Link href="/" aria-label="ADORA Basketball Club — ke atas halaman" className="flex items-center gap-3 group">
          <div className="w-16 h-16 flex items-center justify-center transition-all group-hover:scale-110">
            <Image src="/logo-adora.png" alt="Adora BBC Logo" width={64} height={64} className="object-contain" />
          </div>
          <span className="font-heading text-xl tracking-widest uppercase text-white group-hover:text-primary transition-colors hidden sm:block">
            ADORA <span className="text-primary">BBC</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} className="text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-primary transition-colors">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white px-5 py-2 rounded-full hover:bg-white hover:text-black transition-all">
            Login
          </Link>
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center text-white/70 hover:text-primary transition-colors"
            onClick={() => setOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Mobile drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-page-dark border-l border-white/10 z-50 md:hidden flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <span className="font-heading text-sm tracking-widest uppercase text-white">Menu</span>
          <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="text-white/70 hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col p-6 flex-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold uppercase tracking-widest text-white/70 hover:text-primary py-4 border-b border-white/5 transition-colors"
            >
              {label}
            </a>
          ))}
          <Link
            href="/login"
            className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white px-5 py-3 rounded-full hover:bg-white hover:text-black transition-all"
          >
            Login Portal
          </Link>
        </nav>

        <div className="px-6 pb-8 flex gap-4">
          <a
            href={`https://instagram.com/${CONTACT.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram ADORA BBC"
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-primary hover:border-primary transition-colors"
          >
            <InstagramIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

export { InstagramIcon };
