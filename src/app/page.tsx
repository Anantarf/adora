import Link from "next/link";
import Image from "next/image";
import { getPublicHomebases } from "@/actions/homebase";
import { Metadata } from "next";
import { MapPin, MessageCircle, Music2, Trophy, ClipboardList, Zap } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { HomebaseSection } from "@/components/features/homebase-section";
import { GallerySection } from "@/components/features/gallery-section";
import { AutoFadeCarousel } from "@/components/ui/auto-fade-carousel";
import { LandingHeader, InstagramIcon } from "@/components/features/landing-header";
import { PROGRAMS } from "@/lib/constants/programs";
import { CONTACT } from "@/lib/constants/contact";
import { NAV_LINKS } from "@/lib/constants/navigation";
import { REGISTRATION_STEPS } from "@/lib/constants/landing";
import { getAcademicYear } from "@/lib/utils";
import React from "react";

export const metadata: Metadata = {
  title: "ADORA Basketball Club — Official Page",
  description: "Klub bola basket Depok untuk usia 7–18 tahun. ADORA BBC membentuk pemain muda berkarakter melalui pelatihan modern, mulai dari KEJURKOT, ASBC, hingga Liga Basket Depok.",
  openGraph: {
    title: "ADORA Basketball Club",
    description: "Karakter. Prestasi. Kejuaraan. ADORA Basketball Club berkomitmen membentuk pemain muda Depok yang siap bersaing di level nasional.",
    url: "https://adora.club",
    siteName: "ADORA Basketball",
    locale: "id_ID",
    type: "website",
  },
};



export default async function LandingPage() {
  const homebases = await getPublicHomebases();
  const registrationYearText = getAcademicYear();

  return (
    <main className="min-h-screen bg-page-dark text-white relative overflow-x-hidden pt-18">
      <LandingHeader />

      {/* ── Hero Section ── */}
      <section id="home" className="relative min-h-[calc(100vh-72px)] flex items-center justify-center bg-brand-purple py-20 clip-diagonal-bottom">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image src="/images/hero/hero.jpg" alt="ADORA Basketball Team" fill sizes="100vw" className="object-cover object-center opacity-30 mix-blend-luminosity" priority />
          <div className="absolute inset-0 bg-linear-to-t from-brand-purple via-brand-purple/80 to-brand-purple/40 mix-blend-multiply z-10" />
          <div className="absolute inset-0 pattern-halftone opacity-20 z-10" />
        </div>

        <div className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center">
          <FadeIn delay={0.1} direction="up">
            <div className="inline-block skew-box bg-brand-yellow px-4 py-1.5 md:px-8 md:py-3 mb-6 md:mb-8 border-b-4 border-r-4 border-black shadow-lg mx-2">
              <span className="unskew-content block font-heading font-black uppercase text-black text-[9px] sm:text-xs md:text-sm tracking-widest md:tracking-[0.2em] pr-1 md:pr-2">
                NOW OPEN REGISTRATION {registrationYearText}
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} direction="up">
            <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-7xl tracking-tight uppercase mb-6 leading-tight text-white drop-shadow-2xl italic py-2">
              MEMBANGUN <span className="inline-block text-transparent bg-clip-text bg-linear-to-br from-brand-yellow to-brand-orange pr-4 md:pr-6">KARAKTER</span>
              <br />
              MERAIH <span className="inline-block text-transparent bg-clip-text bg-linear-to-br from-brand-orange to-red-500 pr-4 md:pr-6">PRESTASI</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3} direction="up">
            <p className="max-w-2xl text-sm sm:text-base md:text-lg text-white mb-10 leading-relaxed font-medium drop-shadow-md bg-black/30 p-4 md:p-5 rounded-2xl backdrop-blur-sm border border-white/10">
              Klub basket terdepan di Depok. Membina talenta muda usia 7–16 tahun dengan pendekatan menyenangkan, membangun karakter, dan menyiapkan mereka menuju KEJURKOT hingga kompetisi nasional.
            </p>
          </FadeIn>

          <FadeIn delay={0.4} direction="up">
            <Link
              href="/register"
              className="inline-flex skew-box bg-linear-to-r from-brand-orange to-orange-700 hover:from-brand-yellow hover:to-brand-orange text-white hover:text-black font-black px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4 transition-all text-xs sm:text-sm md:text-xl uppercase tracking-widest hover:scale-110 shadow-[6px_6px_0px_#000] border-2 border-black group"
            >
              <span className="unskew-content flex items-center gap-2 sm:gap-3 italic pr-2">
                DAFTAR SEKARANG <span className="group-hover:translate-x-2 transition-transform">→</span>
              </span>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Program & Kelas ── */}
      <section id="program" className="pt-16 pb-24 bg-page-dark scroll-mt-20 relative -mt-10 z-10">
        <div className="container mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
                <h2 className="font-heading font-black text-2xl md:text-4xl text-white uppercase tracking-widest italic">PROGRAM KELAS</h2>
              </div>
              <p className="text-white/60 max-w-2xl mx-auto font-medium text-xs md:text-base px-4">Pelatihan berbasis usia untuk memaksimalkan potensi, fisik, dan mental pemain.</p>
            </div>
          </FadeIn>

          <StaggerContainer className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto" delay={0.2}>
            {PROGRAMS.map(({ label, ages, desc, image }) => (
              <StaggerItem key={label} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-md relative group">
                {/* Accent Background Box (Pop-out effect) */}
                <div className="absolute inset-0 bg-brand-purple rounded-card transform translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform z-0"></div>

                <div className="relative z-10 bg-surface-dark border-2 border-white/10 group-hover:border-brand-yellow rounded-card transition-all flex flex-col overflow-hidden shadow-xl w-full aspect-square block">
                  {/* Background Image (1:1) */}
                  <div className="absolute inset-0 bg-black">
                    {image ? (
                      <Image
                        src={image}
                        alt={`Program ${label}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        priority={label === "KU‑8" || label === "KU‑12"}
                        className="object-cover transition-all duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-100"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 pattern-halftone opacity-30 z-0"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <span className="text-white/20 font-heading font-black text-lg uppercase tracking-widest text-center italic">FOTO {label}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent z-10"></div>

                  {/* Age Badge - Top Right */}
                  <div className="absolute top-5 right-5 z-20 skew-box bg-brand-yellow text-black px-4 py-1.5 shadow-[4px_4px_0px_#000] border border-black">
                    <span className="unskew-content block font-heading font-black text-sm tracking-widest italic">{ages}</span>
                  </div>

                  {/* Text Content - Bottom */}
                  <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end z-20">
                    <h3 className="font-heading font-black text-2xl md:text-3xl text-white tracking-widest mb-2 uppercase italic group-hover:text-brand-yellow transition-colors drop-shadow-lg leading-tight">{label}</h3>
                    <p className="text-white/70 text-sm md:text-base leading-relaxed font-medium drop-shadow-md">{desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Homebase ── */}
      <HomebaseSection homebases={homebases} />

      {/* ── Adora Sports Entertainment & Turnamen ── */}
      <section id="turnamen" className="relative pt-16 pb-24 bg-brand-purple scroll-mt-20 clip-diagonal z-30 -mt-10">
        {/* Background Textures */}
        <div className="absolute inset-0 pattern-halftone opacity-20 pointer-events-none overflow-hidden"></div>

        <div className="container mx-auto px-4 relative z-10">
          <FadeIn direction="up">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-8 items-center bg-black/40 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-card-lg shadow-2xl">
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-8">
                <div className="w-full">
                  <div className="inline-block skew-box bg-brand-yellow px-4 py-1 mb-4 border-b-4 border-r-4 border-black">
                    <span className="unskew-content block font-heading font-black uppercase text-black text-xs tracking-widest">EVENT & TURNAMEN</span>
                  </div>
                  <h3 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white uppercase tracking-widest mb-3 italic drop-shadow-lg wrap-break-word">
                    Adora Sports <br />
                    <span className="text-brand-orange pr-2">Entertainment</span>
                  </h3>
                  <p className="text-white/80 text-xs md:text-base leading-relaxed mb-6 font-medium">Dua turnamen resmi yang kami selenggarakan setiap tahun sebagai wadah kompetisi usia dini terbaik di Depok.</p>
                  <ul className="text-left space-y-3 text-sm md:text-base text-white">
                    <li className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-brand-orange transition-colors">
                      <div className="bg-brand-orange p-3 rounded-xl shrink-0 text-black">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <strong className="text-brand-yellow font-black text-xl tracking-widest uppercase block mb-1">ASBC</strong>
                        <span className="text-white/70">Adora Student Basketball Championship (ASBC), turnamen antar pelajar sekolah.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-brand-orange transition-colors">
                      <div className="bg-brand-orange p-3 rounded-xl shrink-0 text-black">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <strong className="text-brand-yellow font-black text-xl tracking-widest uppercase block mb-1">ABCC</strong>
                        <span className="text-white/70">Adora Basketball Club Championship (ABCC), kompetisi seru antar klub basket.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <a
                  href={`https://instagram.com/${CONTACT.asbc_instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex skew-box items-center gap-2 bg-transparent border-4 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-black px-6 py-3 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 shadow-[4px_4px_0px_#000]"
                >
                  <span className="unskew-content flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    INFO TURNAMEN
                  </span>
                </a>
              </div>

              <div className="w-full relative">
                {/* Pop-out ornament */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-orange rounded-full mix-blend-screen filter blur-xl animate-pulse z-0"></div>
                <div className="relative z-10 border-4 border-black shadow-[12px_12px_0px_#CCFF00] rounded-card overflow-hidden bg-black">
                  <AutoFadeCarousel images={["/images/tournaments/asbcnew1.JPG", "/images/tournaments/asbcnew2.JPG", "/images/tournaments/asbcnew3.jpg", "/images/tournaments/asbc4.jpg", "/images/tournaments/asbc5.jpg"]} />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Adora In Action (Galeri Kolase) ── */}
      <GallerySection />

      {/* ── Cara Mendaftar ── */}
      <section id="daftar" className="py-24 bg-surface-dark scroll-mt-20 relative z-20 -mt-10">
        <div className="container mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-16">
              <p className="text-brand-orange font-heading font-black text-lg md:text-2xl uppercase tracking-widest italic mb-2">Mau jadi bagian dari momen ini?</p>
              <h2 className="font-heading font-black text-2xl md:text-4xl text-white uppercase tracking-widest mb-3 italic">CARA BERGABUNG</h2>
              <p className="text-white/60 max-w-2xl mx-auto font-medium text-sm md:text-base">Bergabunglah bersama ratusan pemain muda Adora Basketball Club. Proses pendaftaran mudah, 100% online.</p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16" delay={0.2}>
            {REGISTRATION_STEPS.map(({ step, title, desc }) => (
              <StaggerItem key={step} className="relative group">
                {/* Offset Shadow Box */}
                <div className="absolute inset-0 bg-brand-orange rounded-2xl transform translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>

                <div className="relative text-center p-6 bg-page-dark rounded-2xl border-2 border-black h-full flex flex-col items-center">
                  <div className="skew-box w-14 h-14 bg-brand-yellow text-black font-heading font-black text-2xl flex items-center justify-center mb-5 border-2 border-black shadow-[4px_4px_0px_#000]">
                    <span className="unskew-content italic">{step}</span>
                  </div>
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-widest mb-2 italic">{title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed font-medium">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.4} direction="up" className="text-center">
            <Link
              href="/register"
              className="inline-flex skew-box bg-linear-to-r from-brand-orange to-orange-700 hover:from-brand-yellow hover:to-brand-orange text-white hover:text-black font-black px-5 py-2.5 sm:px-6 sm:py-3 md:px-10 md:py-4 transition-all text-xs sm:text-sm md:text-base uppercase tracking-widest hover:scale-110 shadow-[6px_6px_0px_#000] border-2 border-black group"
            >
              <span className="unskew-content flex items-center gap-2 sm:gap-3 italic">
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
                ISI FORMULIR SEKARANG
              </span>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Final Call to Action ── */}
      <section className="py-20 bg-brand-purple relative overflow-hidden z-20">
        <div className="absolute inset-0 pattern-halftone opacity-10 pointer-events-none"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <FadeIn direction="up">
            <h2 className="font-heading font-black text-3xl md:text-5xl text-white uppercase tracking-widest italic mb-6">
              SIAP MENJADI <span className="text-brand-yellow">JUARA?</span>
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-10 font-medium text-sm md:text-lg">
              Jangan lewatkan kesempatan untuk bergabung dengan klub basket terbaik di Depok. Kuota pemain terbatas untuk setiap kelompok usia!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex skew-box bg-brand-yellow text-black font-black px-8 py-4 transition-all uppercase tracking-widest hover:scale-105 shadow-[6px_6px_0px_#000] border-2 border-black"
              >
                <span className="unskew-content italic">DAFTAR SEKARANG</span>
              </Link>
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex skew-box bg-white/10 border-2 border-white/20 text-white px-8 py-4 hover:bg-white hover:text-black transition-all uppercase tracking-widest"
              >
                <span className="unskew-content italic">TANYA ADMIN</span>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t-8 border-brand-purple bg-page-dark pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-24 h-24 flex items-center justify-center">
                  <Image src="/logo-new.png" alt="Adora BBC Logo" width={96} height={96} className="w-auto h-auto object-contain" style={{ width: "auto", height: "auto" }} />
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-6 font-medium">
                Berdiri sejak 2020, Adora Basketball Club (ADORA BBC) berdedikasi menjadi pusat pembinaan basket terdepan di Depok. Misi kami tidak hanya mencetak atlet berprestasi, tetapi juga membangun karakter anak bangsa yang sportif,
                disiplin, dan tangguh melalui olahraga.
              </p>
              <div className="flex gap-4">
                <a
                  href={`https://instagram.com/${CONTACT.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-brand-orange hover:text-black hover:border-black transition-all"
                >
                  <InstagramIcon className="w-5 h-5" />
                </a>
                <a
                  href={`https://www.tiktok.com/@${CONTACT.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-brand-orange hover:text-black hover:border-black transition-all"
                >
                  <Music2 className="w-5 h-5" />
                </a>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-brand-orange hover:text-black hover:border-black transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="md:col-span-3 md:col-start-7">
              <h4 className="font-heading text-lg font-black uppercase tracking-widest text-brand-yellow mb-6">Navigasi</h4>
              <ul className="space-y-4">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <a href={href} className="text-sm text-white/70 hover:text-brand-orange transition-colors font-bold uppercase tracking-wider">
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link href="/login" className="text-sm text-brand-orange hover:text-white transition-colors font-bold uppercase tracking-wider flex items-center gap-2">
                    Login Portal →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="font-heading text-lg font-black uppercase tracking-widest text-brand-yellow mb-6">Kontak Kami</h4>
              <ul className="space-y-4 text-sm text-white/70 font-medium">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 w-5 h-5 shrink-0 text-brand-orange" />
                  <span>{CONTACT.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 shrink-0 text-brand-orange" />
                  <span>
                    +{CONTACT.whatsapp} ({CONTACT.whatsapp_name})
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 shrink-0 text-brand-orange" />
                  <span>
                    +{CONTACT.whatsapp_alt} ({CONTACT.whatsapp_alt_name})
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase">&copy; {new Date().getFullYear()} ADORA Basketball Club. All rights reserved.</p>
            <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase">Licensed by PERBASI</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
