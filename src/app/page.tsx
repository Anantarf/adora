import Link from "next/link";
import Image from "next/image";
import { getPublicHomebases } from "@/actions/homebase";
import { Metadata } from "next";
import { MapPin, MessageCircle, Music2, Trophy, ClipboardList } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { HomebaseSection } from "@/components/features/homebase-section";
import { AutoFadeCarousel } from "@/components/ui/auto-fade-carousel";
import { LandingHeader, InstagramIcon } from "@/components/features/landing-header";
import { PROGRAMS } from "@/lib/constants/programs";
import { CONTACT } from "@/lib/constants/contact";
import { NAV_LINKS } from "@/lib/constants/navigation";
import React from "react";

export const metadata: Metadata = {
  title: "ADORA Basketball Club — Official Page",
  description: "Klub bola basket Depok untuk usia 7–18 tahun. ADORA BBC membentuk pemain muda berkarakter melalui pelatihan modern — KEJURKOT, ASBC, dan Liga Basket Depok.",
  openGraph: {
    title: "ADORA Basketball Club",
    description: "Karakter. Prestasi. Kejuaraan. ADORA Basketball Club — membentuk pemain muda Depok yang siap bersaing di level nasional.",
    url: "https://adora.club",
    siteName: "ADORA Basketball",
    locale: "id_ID",
    type: "website",
  },
};

// ─── Data Constants ───────────────────────────────────────────────────────────

const REGISTRATION_STEPS = [
  {
    step: "1",
    title: "Pilih Lokasi Latihan",
    desc: "Tentukan lokasi latihan terdekat dengan Anda untuk mulai berlatih.",
  },
  {
    step: "2",
    title: "Isi Data Diri",
    desc: "Lengkapi formulir pendaftaran pemain secara online di website ini.",
  },
  {
    step: "3",
    title: "Konfirmasi via WhatsApp",
    desc: "Hubungi admin kami via WhatsApp untuk konfirmasi pendaftaran dan informasi pembayaran.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const homebases = await getPublicHomebases();

  return (
    <main className="min-h-screen bg-page-dark text-white relative">

      {/* ── Sticky Navbar ── */}
      <LandingHeader />

      {/* ── Hero Section ── */}
      <section id="home" className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-surface-dark z-0">
          <Image
            src="/images/hero/adora-team-1.png"
            alt="ADORA Basketball Team"
            fill
            className="object-cover object-center opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-page-dark/40 via-page-dark/60 to-page-dark z-10" />
        </div>

        <div className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center">
          <FadeIn delay={0.2} direction="up">
            <h1 className="font-heading text-5xl md:text-7xl tracking-[0.1em] uppercase mb-6 leading-tight text-white drop-shadow-2xl">
              Membangun <span className="text-primary">Karakter</span><br />
              Meraih <span className="text-primary">Prestasi</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3} direction="up">
            <p className="max-w-2xl text-lg text-white/80 mb-10 leading-relaxed font-medium drop-shadow-md">
              Bergabung bersama klub basket terdepan di Depok. Kami membina talenta muda usia 7–16 tahun dengan pendekatan menyenangkan, membangun karakter, dan menyiapkan mereka menuju Kejuaraan Kota (KEJURKOT) hingga kompetisi nasional.
            </p>
          </FadeIn>

          <FadeIn delay={0.4} direction="up">
            <Link href="/register" className="bg-primary hover:bg-primary/90 text-black font-bold px-8 py-4 rounded-full transition-all text-sm uppercase tracking-widest hover:scale-105 shadow-xl shadow-primary/20">
              Daftar & Mulai Berlatih
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Program & Kelas ── */}
      <section id="program" className="py-20 bg-page-dark scroll-mt-20">
        <div className="container mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-16">
              <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-4">Program Kelas</h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Kami mengelompokkan pelatihan berdasarkan kelompok usia untuk memastikan materi sesuai dengan perkembangan fisik dan mental anak.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-7xl mx-auto" delay={0.2}>
            {PROGRAMS.map(({ label, ages, desc, image }) => (
              <StaggerItem
                key={label}
                className="w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-2rem)] max-w-md bg-surface-dark border border-white/10 hover:border-primary/40 rounded-[2rem] transition-all hover:-translate-y-2 hover:shadow-primary-soft group flex flex-col overflow-hidden shadow-xl"
              >
                <div className="relative w-full aspect-video overflow-hidden bg-white/5">
                  {image ? (
                    <Image
                      src={image}
                      alt={`Program ${label}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/8 to-transparent flex flex-col items-center justify-center gap-3">
                      <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 text-primary/25" aria-hidden="true">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M4 24h40M24 4v40" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M9.6 9.6c5.3 5.3 5.3 23.5 0 28.8M38.4 9.6c-5.3 5.3-5.3 23.5 0 28.8" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      <span className="font-heading text-3xl text-primary/40 tracking-widest">{label}</span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col items-center text-center">
                  <h3 className="font-heading text-2xl text-white tracking-widest mb-1 group-hover:text-primary transition-colors">{label}</h3>
                  <div className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded font-bold tracking-widest uppercase mb-3">
                    {ages}
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Homebase ── */}
      <div id="homebase" className="relative z-10 bg-surface-dark border-y border-white/10 scroll-mt-20">
        <HomebaseSection homebases={homebases} />
      </div>

      {/* ── Adora Sports Entertainment & Turnamen ── */}
      <section id="turnamen" className="py-20 bg-primary/5 border-y border-primary/10 scroll-mt-20">
        <div className="container mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-10">
              <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-4">Turnamen</h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Kami menyelenggarakan dua turnamen basket tahunan — terbuka untuk pelajar dan klub dari seluruh Indonesia.
              </p>
            </div>
          </FadeIn>

          <FadeIn direction="up">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center bg-surface-dark border border-white/10 p-6 md:p-8 rounded-[2rem]">

              <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-8">
                <div className="w-full">
                  <h3 className="font-heading text-2xl md:text-3xl text-white uppercase tracking-widest mb-4">Adora Sports Entertainment</h3>
                  <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6">
                    Dua turnamen resmi yang kami selenggarakan setiap tahun:
                  </p>
                  <ul className="text-left space-y-4 text-sm md:text-base text-white/80">
                    <li className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                      <Trophy className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-primary font-bold block mb-1">ASBC</strong>
                        <span>Adora Student Basketball Championship — turnamen antar pelajar, terbuka untuk tim sekolah seluruh Indonesia.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                      <Trophy className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-primary font-bold block mb-1">ABCC</strong>
                        <span>Adora Basketball Club Championship — turnamen antar klub basket dengan format kompetisi penuh.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <a
                  href={`https://instagram.com/${CONTACT.asbc_instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 border-2 border-primary text-primary hover:bg-primary hover:text-black px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all hover:scale-105"
                >
                  <Trophy className="w-4 h-4" />
                  Info Turnamen
                </a>
              </div>

              <div className="w-full">
                <AutoFadeCarousel />
              </div>

            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Cara Mendaftar ── */}
      <section id="daftar" className="py-20 bg-surface-dark border-t border-white/10 scroll-mt-20">
        <div className="container mx-auto px-4">
          <FadeIn direction="up">
            <div className="text-center mb-16">
              <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-4">Cara Bergabung</h2>
              <p className="text-white/60 max-w-2xl mx-auto font-medium">Proses pendaftaran mudah, 100% online.</p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16" delay={0.2}>
            {REGISTRATION_STEPS.map(({ step, title, desc }) => (
              <StaggerItem key={step} className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-black font-heading text-2xl mb-6">
                  {step}
                </div>
                <h3 className="font-heading text-xl text-white uppercase tracking-widest mb-3">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.4} direction="up" className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-black font-bold px-10 py-4 rounded-full transition-all text-sm uppercase tracking-widest hover:scale-105 shadow-xl shadow-primary/20"
            >
              <ClipboardList className="w-4 h-4" />
              Isi Formulir Pendaftaran
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-primary/20 bg-page-dark pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-12 gap-12 mb-16">

            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-20 h-20 flex items-center justify-center">
                  <Image src="/logo-adora.png" alt="Adora BBC Logo" width={80} height={80} className="object-contain" />
                </div>
                <span className="font-heading text-2xl tracking-widest uppercase text-white">
                  ADORA <span className="text-primary">BBC</span>
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Berdiri sejak 2020, Adora Basketball Club (ADORA BBC) berdedikasi menjadi pusat pembinaan basket terdepan di Depok.
                Misi kami tidak hanya mencetak atlet berprestasi, tetapi juga membangun karakter anak bangsa yang sportif, disiplin, dan tangguh melalui olahraga.
              </p>
              <div className="flex gap-4">
                <a
                  href={`https://instagram.com/${CONTACT.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-primary hover:border-primary transition-colors"
                  aria-label="Instagram ADORA BBC"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.tiktok.com/@${CONTACT.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-primary hover:border-primary transition-colors"
                  aria-label="TikTok ADORA BBC"
                >
                  <Music2 className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-primary hover:border-primary transition-colors"
                  aria-label="WhatsApp ADORA BBC"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="md:col-span-3 md:col-start-7">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-6">Navigasi</h4>
              <ul className="space-y-4">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <a href={href} className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link href="/login" className="text-sm text-primary hover:text-white transition-colors font-medium flex items-center gap-2">
                    Login Portal →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-6">Kontak Kami</h4>
              <ul className="space-y-4 text-sm text-white/70">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 w-4 h-4 shrink-0 opacity-50" />
                  <span>{CONTACT.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 shrink-0 opacity-50" />
                  <span>+{CONTACT.whatsapp} ({CONTACT.whatsapp_name})</span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 shrink-0 opacity-50" />
                  <span>+{CONTACT.whatsapp_alt} ({CONTACT.whatsapp_alt_name})</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-white/30 text-[10px] font-medium tracking-widest uppercase">
              &copy; {new Date().getFullYear()} ADORA Basketball Club. All rights reserved.
            </p>
            <p className="text-white/30 text-[10px] font-medium tracking-widest uppercase">
              Licensed by PERBASI
            </p>
          </div>
        </div>
      </footer>

    </main>
  );
}
