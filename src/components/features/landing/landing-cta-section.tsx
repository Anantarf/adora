import Link from "next/link";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { REGISTRATION_STEPS } from "@/lib/constants/landing";
import { Handshake } from "lucide-react";
import { CONTACT } from "@/lib/constants/contact";

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

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-10 lg:gap-12 items-center">
          {/* Left Side (Span 5): Individual Player Registration */}
          <div className="lg:col-span-5 text-left flex flex-col items-start">
            <FadeIn direction="up">
              <h2 className="font-heading font-black text-2xl md:text-5xl text-white uppercase tracking-widest italic mb-3 drop-shadow-lg leading-tight">
                SIAP MENJADI <span className="text-brand-yellow">JUARA?</span>
              </h2>
              <p className="text-white/90 mb-8 font-medium text-sm md:text-base leading-relaxed">
                Pendaftaran mudah, cepat, dan 100% online.
              </p>

              <StaggerContainer className="flex flex-col gap-5 mb-10 w-full" delay={0.2}>
                {REGISTRATION_STEPS.map(({ step, title, desc }) => (
                  <StaggerItem key={step} className="flex items-start gap-4 group">
                    <div className="text-brand-orange font-heading font-black text-2xl md:text-3xl italic drop-shadow-sm shrink-0 transition-transform group-hover:scale-110 pt-0.5">
                      0{step}
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading font-black text-sm text-white uppercase tracking-widest leading-none mb-1.5 italic group-hover:text-brand-yellow transition-colors">
                        {title}
                      </h3>
                      <p className="text-white/60 text-xs font-medium max-w-xl leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <Link
                  href="/register"
                  className="inline-flex skew-box bg-brand-yellow hover:bg-white text-black font-black px-10 py-3.5 transition-all uppercase tracking-[0.2em] text-sm md:text-base hover:scale-110 shadow-[6px_6px_0px_#000] border-2 border-black group"
                >
                  <span className="unskew-content italic flex items-center gap-3">
                    DAFTAR SEKARANG <span className="group-hover:translate-x-2 transition-transform">→</span>
                  </span>
                </Link>
                <div className="flex flex-col gap-1">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                    Kuota terbatas untuk setiap kelompok usia
                  </p>
                  <div className="w-12 h-1 bg-brand-orange/40 rounded-full"></div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right Side (Span 3): School referals partnership card */}
          <div className="lg:col-span-3 w-full">
            <FadeIn direction="up">
              <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-white/20 hover:border-brand-orange/50 bg-black/30 backdrop-blur-xs p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 shadow-2xl">
                <div className="absolute inset-0 pattern-halftone opacity-10 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-start gap-4">
                  {/* Icon Badge */}
                  <div className="w-11 h-11 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center">
                    <Handshake className="w-5 h-5 text-brand-orange" />
                  </div>

                  {/* Header */}
                  <div>
                    <span className="text-[10px] font-bold text-brand-orange uppercase tracking-[0.25em] mb-1 block">
                      SCHOOL PARTNERSHIP
                    </span>
                    <h3 className="font-heading font-black text-lg md:text-xl text-white uppercase tracking-wider italic leading-tight">
                      Kemitraan Sekolah
                    </h3>
                  </div>

                  {/* Copy Info */}
                  <div className="space-y-3">
                    <p className="text-white/80 font-bold text-xs md:text-sm leading-snug">
                      Bina Bakat Basket Siswa Bersama Adora!
                    </p>
                    <p className="text-white/50 text-[11px] md:text-xs font-medium leading-relaxed">
                      Adora membuka kerja sama resmi dengan sekolah untuk menyalurkan dan membina potensi bola basket siswa Anda secara terarah di klub profesional kami.
                    </p>
                  </div>

                  {/* WhatsApp Referral Direct Trigger */}
                  <a
                    href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
                      "Halo Adora BBC, sekolah kami tertarik untuk bekerja sama dalam program kemitraan penyaluran dan pembinaan bakat olahraga bola basket siswa kami ke klub."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-3.5 text-[10px] font-bold uppercase tracking-[0.25em] bg-white/5 border border-white/10 hover:bg-brand-orange hover:text-white hover:border-brand-orange rounded-xl transition-all duration-300 text-white/80 flex items-center justify-center gap-2"
                  >
                    Hubungi Kami
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
