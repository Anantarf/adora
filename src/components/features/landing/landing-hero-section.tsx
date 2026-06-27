"use client";

import Link from "next/link";
import Image from "next/image";
import { FadeIn } from "@/components/animations/fade-in";
import { buttonVariants } from "@/components/ui/button";

interface LandingHeroSectionProps {
  registrationYearText: string;
}

export function LandingHeroSection({ registrationYearText }: LandingHeroSectionProps) {
  return (
    <section id="home" className="relative min-h-[calc(100vh-72px)] flex items-center justify-center bg-brand-purple pt-14 pb-12 md:py-20 clip-diagonal-bottom">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/hero/hero.jpg"
          alt="Tim ADORA Basketball Club Depok - Pelatihan Basket Usia Dini"
          fill
          sizes="100vw"
          quality={75}
          className="object-cover object-center opacity-55"
          preload
        />
        <div className="absolute inset-0 bg-linear-to-t from-brand-purple via-brand-purple/72 to-brand-purple/28 z-10" />
        <div className="absolute inset-0 pattern-halftone opacity-12 z-10" />
      </div>

      <div className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center">
        <FadeIn delay={0.1} direction="up">
          <div className="inline-block skew-box bg-brand-yellow px-3 py-1.5 sm:px-4 md:px-8 md:py-3 mb-6 md:mb-8 border-b-4 border-r-4 border-black shadow-lg mx-2 max-w-full">
            <span className="unskew-content block font-heading font-black uppercase text-black text-[10px] sm:text-xs md:text-sm tracking-wide pr-1 md:pr-2 leading-tight sm:whitespace-nowrap">PENDAFTARAN DIBUKA {registrationYearText}</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} direction="up">
          <h1 className="text-h1 md:text-7xl uppercase mb-6 leading-[0.98] sm:leading-tight text-white drop-shadow-2xl py-2 text-balance max-w-5xl">
            MEMBANGUN <span className="inline-block text-brand-yellow pr-1.5 sm:pr-4 md:pr-6">KARAKTER</span>
            <br />
            MERAIH <span className="inline-block text-brand-orange pr-1.5 sm:pr-4 md:pr-6">PRESTASI</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.3} direction="up">
          <p className="text-body-lg max-w-2xl text-white mb-8 md:mb-10 leading-relaxed drop-shadow-md bg-black/30 p-4 md:p-5 rounded-2xl backdrop-blur-sm border border-white/10 text-pretty">
            Klub basket terdepan di Depok. Membina talenta muda usia 7–16 tahun dengan pendekatan menyenangkan, membangun karakter, dan menyiapkan mereka menuju KEJURKOT hingga kompetisi nasional.
          </p>
        </FadeIn>

        <FadeIn delay={0.4} direction="up">
          <Link href="/register" className={buttonVariants({ variant: "cta", size: "xl", className: "uppercase group" })}>
            DAFTAR SEKARANG <span className="group-hover:translate-x-2 transition-transform">→</span>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
