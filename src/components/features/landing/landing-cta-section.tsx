import Link from "next/link";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { REGISTRATION_STEPS } from "@/lib/constants/landing";

export function LandingCtaSection() {
  return (
    <section id="daftar" className="py-14 md:py-24 bg-brand-purple relative overflow-hidden z-20 scroll-mt-20">
      <div className="absolute inset-0 pattern-halftone opacity-20 pointer-events-none"></div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/20 blur-[120px] -mr-48 -mt-48 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-yellow/10 blur-[100px] -ml-40 -mb-40 pointer-events-none"></div>

      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-0.5 h-[120%] bg-brand-orange rotate-45"></div>
        <div className="absolute top-[-10%] left-[15%] w-px h-[120%] bg-white rotate-45"></div>
        <div className="absolute top-[-10%] right-[10%] w-px h-[120%] bg-brand-yellow rotate-45"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <FadeIn direction="up">
          <h2 className="font-heading font-black text-2xl md:text-5xl text-white uppercase tracking-widest italic mb-2.5 md:mb-4 drop-shadow-lg">
            SIAP MENJADI <span className="text-brand-yellow">JUARA?</span>
          </h2>
          <p className="text-white/90 max-w-xl mx-auto mb-7 md:mb-10 font-medium text-sm md:text-base leading-relaxed">Pendaftaran mudah, cepat, dan 100% online.</p>

          <StaggerContainer className="flex flex-col md:flex-row items-center justify-center gap-2.5 md:gap-12 max-w-4xl mx-auto mb-8 md:mb-12" delay={0.2}>
            {REGISTRATION_STEPS.map(({ step, title, desc }) => (
              <StaggerItem key={step} className="flex items-center gap-3 md:gap-4 relative group">
                <div className="text-brand-orange font-heading font-black text-2xl md:text-3xl italic drop-shadow-sm shrink-0 transition-transform group-hover:scale-110">0{step}</div>
                <div className="text-left">
                  <h3 className="font-heading font-black text-xs md:text-sm text-white uppercase tracking-widest leading-none mb-1 italic group-hover:text-brand-yellow transition-colors">{title}</h3>
                  <p className="text-white/60 text-xs font-medium max-w-37.5 md:max-w-45 leading-tight">{desc}</p>
                </div>
                {step !== "3" && <div className="hidden md:block w-px h-8 bg-brand-orange/30 ml-8"></div>}
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="flex flex-col items-center">
            <Link
              href="/register"
              className="inline-flex skew-box bg-brand-yellow hover:bg-white text-black font-black px-10 py-3.5 transition-all uppercase tracking-[0.2em] text-sm md:text-base hover:scale-110 shadow-[6px_6px_0px_#000] border-2 border-black group"
            >
              <span className="unskew-content italic flex items-center gap-3">
                DAFTAR SEKARANG <span className="group-hover:translate-x-2 transition-transform">→</span>
              </span>
            </Link>
            <div className="mt-5 md:mt-6 flex flex-col items-center gap-1">
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Kuota terbatas untuk setiap kelompok usia</p>
              <div className="w-12 h-1 bg-brand-orange/40 rounded-full"></div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
