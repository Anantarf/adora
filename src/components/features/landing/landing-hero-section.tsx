import Link from "next/link";
import Image from "next/image";
import { FadeIn } from "@/components/animations/fade-in";

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
          quality={40}
          className="object-cover object-center opacity-30 mix-blend-luminosity"
          priority
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-linear-to-t from-brand-purple via-brand-purple/80 to-brand-purple/40 mix-blend-multiply z-10" />
        <div className="absolute inset-0 pattern-halftone opacity-20 z-10" />
      </div>

      <div className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center">
        <FadeIn delay={0.1} direction="up">
          <div className="inline-block skew-box bg-brand-yellow px-4 py-1.5 md:px-8 md:py-3 mb-6 md:mb-8 border-b-4 border-r-4 border-black shadow-lg mx-2">
            <span className="unskew-content block font-heading font-black uppercase text-black text-[9px] sm:text-xs md:text-sm tracking-widest md:tracking-[0.2em] pr-1 md:pr-2">NOW OPEN REGISTRATION {registrationYearText}</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} direction="up">
          <h1 className="font-heading font-black text-[2.1rem] sm:text-5xl md:text-7xl tracking-tight uppercase mb-6 leading-tight text-white drop-shadow-2xl italic py-2">
            MEMBANGUN <span className="inline-block text-transparent bg-clip-text bg-linear-to-br from-brand-yellow to-brand-orange pr-2 sm:pr-4 md:pr-6">KARAKTER</span>
            <br />
            MERAIH <span className="inline-block text-transparent bg-clip-text bg-linear-to-br from-brand-orange to-red-500 pr-2 sm:pr-4 md:pr-6">PRESTASI</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.3} direction="up">
          <p className="max-w-2xl text-sm sm:text-base md:text-lg text-white mb-8 md:mb-10 leading-relaxed font-medium drop-shadow-md bg-black/30 p-3.5 md:p-5 rounded-2xl backdrop-blur-sm border border-white/10">
            Klub basket terdepan di Depok. Membina talenta muda usia 7–16 tahun dengan pendekatan menyenangkan, membangun karakter, dan menyiapkan mereka menuju KEJURKOT hingga kompetisi nasional.
          </p>
        </FadeIn>

        <FadeIn delay={0.4} direction="up">
          <Link
            href="/register"
            className="inline-flex skew-box bg-linear-to-r from-brand-orange to-orange-700 hover:from-brand-yellow hover:to-brand-orange text-white hover:text-black font-black px-8 py-3.5 sm:px-8 sm:py-3 md:px-10 md:py-4 transition-all text-sm md:text-xl uppercase tracking-widest hover:scale-110 shadow-[4px_4px_0px_#000] md:shadow-[6px_6px_0px_#000] border-2 border-black group"
          >
            <span className="unskew-content flex items-center gap-2 sm:gap-3 italic pr-2">
              DAFTAR SEKARANG <span className="group-hover:translate-x-2 transition-transform">→</span>
            </span>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
