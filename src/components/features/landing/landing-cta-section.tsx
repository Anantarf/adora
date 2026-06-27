"use client";

import Link from "next/link";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { REGISTRATION_STEPS } from "@/lib/constants/landing";
import { buttonVariants } from "@/components/ui/button";

export function LandingCtaSection() {
  return (
    <section id="daftar" className="pt-10 pb-16 md:pt-16 md:pb-24 bg-brand-purple relative overflow-hidden z-20 scroll-mt-20">
      <div className="absolute inset-0 pattern-halftone opacity-20 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <FadeIn direction="up">
          <h2 className="text-h2 text-white uppercase mb-2.5 md:mb-4 drop-shadow-lg text-balance">
            SIAP MENJADI <span className="text-brand-yellow">JUARA?</span>
          </h2>
          <p className="text-white/90 max-w-xl mx-auto mb-7 md:mb-10 text-body-lg text-pretty">Pendaftaran mudah, cepat, dan 100% online.</p>

          <StaggerContainer className="flex flex-col md:flex-row items-center justify-center gap-2.5 md:gap-12 max-w-4xl mx-auto mb-8 md:mb-12" delay={0.2}>
            {REGISTRATION_STEPS.map(({ step, title, desc }) => (
              <StaggerItem key={step} className="flex items-center gap-3 md:gap-4 relative group">
                <div className="text-brand-orange font-heading font-black text-2xl md:text-3xl drop-shadow-sm shrink-0 transition-transform group-hover:scale-110">0{step}</div>
                <div className="text-left">
                  <h3 className="font-heading font-black text-xs md:text-sm text-white uppercase tracking-wide leading-none mb-1 group-hover:text-brand-yellow transition-colors">{title}</h3>
                  <p className="text-white/70 text-xs font-medium max-w-[170px] md:max-w-[180px] leading-snug text-pretty">{desc}</p>
                </div>
                {step !== "3" && <div className="hidden md:block w-px h-8 bg-brand-orange/30 ml-8"></div>}
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="flex flex-col items-center">
            <Link href="/register" className={buttonVariants({ variant: "cta", size: "xl", className: "uppercase group h-auto px-7 sm:px-10 py-3.5 text-sm md:text-base" })}>
              DAFTAR SEKARANG <span className="group-hover:translate-x-2 transition-transform">{"->"}</span>
            </Link>
            <div className="mt-5 md:mt-6 flex flex-col items-center gap-1">
              <p className="text-white/55 text-[11px] font-bold uppercase tracking-wide text-center text-balance">Kuota terbatas untuk setiap kelompok usia</p>
              <div className="w-12 h-1 bg-brand-orange/40 rounded-full"></div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
