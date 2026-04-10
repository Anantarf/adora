import Link from "next/link";
import { Starfield } from "@/components/ui/starfield";
import { ClubSchedule } from "@/components/club-schedule";
import { getPublicEventsAction } from "@/actions/schedule";
import { type ScheduleEvent } from "@/types/dashboard";
import { Metadata } from "next";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { HeroCarousel } from "@/components/features/hero-carousel";

export const metadata: Metadata = {
// ... existing Metadata & Constants ...
  title: "ADORA Basketball Club — Official Page",
  description: "Pusat pembinaan bola basket untuk usia 7–18 tahun. Adora Basketball Club membentuk atlet muda berkarakter, berprestasi, dan siap bersaing di KEJURKOT, ASBC, dan Liga Basket Depok.",
  openGraph: {
    title: "ADORA Basketball Club",
    description: "Membentuk masa depan bola basket Indonesia melalui pelatihan modern dan kompetitif.",
    url: "https://adora.club",
    siteName: "ADORA Basketball",
    locale: "id_ID",
    type: "website",
  },
};

// ─── Data Constants ───────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Visi & Misi", href: "#visi-misi" },
  { label: "Program", href: "#program" },
  { label: "Galeri", href: "#galeri" },
  { label: "Jadwal", href: "#jadwal" },
  { label: "Daftar", href: "#daftar" },
];

const STATS = [
  { value: "100+", label: "Atlet Aktif" },
  { value: "4", label: "Program Kelas" },
  { value: "Est. 2020", label: "Berdiri Sejak" },
  { value: "Berlisensi", label: "PERBASI" },
];

const PROGRAMS = [
  {
    label: "KU‑7",
    ages: "7 – 9 Tahun",
    desc: "Program Kids perdana ADORA: mengenalkan dunia basket melalui permainan, gerak dasar, dan kecintaan terhadap olahraga sejak usia belia.",
    icon: "⭐",
  },
  {
    label: "KU‑10",
    ages: "10 – 12 Tahun",
    desc: "Fondasi teknik dan ball-handling yang kuat. Atlet mulai dikenalkan pada sistem latihan terstruktur khas ADORA.",
    icon: "🌱",
  },
  {
    label: "KU‑15",
    ages: "13 – 15 Tahun",
    desc: "Pengembangan taktik, fisik, dan mental kompetisi. Atlet aktif mengikuti sparing day, ASBC, dan Liga Basket Depok.",
    icon: "⚡",
  },
  {
    label: "KU‑18",
    ages: "16 – 18 Tahun",
    desc: "Persiapan menuju KEJURKOT dan turnamen nasional dengan standar pelatihan profesional dan program Camp ADORA.",
    icon: "🏆",
  },
];

const MISSION_POINTS = [
  "Mengembangkan kemampuan teknis dan taktis pemain sejak usia dini.",
  "Menyediakan pelatihan berbasis ilmu olahraga modern.",
  "Mendorong nilai sportivitas, disiplin, dan kerja tim.",
  "Menyelenggarakan kompetisi internal dan partisipasi pada turnamen nasional.",
];

const REGISTRATION_STEPS = [
  {
    step: "1",
    title: "Hubungi Admin",
    desc: "Kontak kami via WhatsApp untuk informasi program dan proses pendaftaran.",
  },
  {
    step: "2",
    title: "Verifikasi Data",
    desc: "Lengkapi data atlet dan orang tua, termasuk fotocopy identitas.",
  },
  {
    step: "3",
    title: "Konfirmasi & Mulai",
    desc: "Setelah konfirmasi, atlet siap mengikuti latihan rutin di Home Court.",
  },
];

const CONTACT_INFO = {
  whatsapp: "08388724552",
  email: "admin@adora.club",
  address: "Home Court, Jakarta",
  instagram: "@adorabbc",
  tiktok: "adora_bbc",
};



// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const eventsResult = await getPublicEventsAction();
  const events = (eventsResult as unknown as ScheduleEvent[]) || [];

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-foreground relative overflow-hidden">
      <Starfield />

      {/* ── Sticky Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0d0d0d]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo — clickable, scrolls to top */}
          <Link href="/" aria-label="ADORA Basketball Club — ke atas halaman">
            <span className="font-heading text-2xl tracking-widest uppercase text-white hover:text-primary transition-colors">
              ADORA <span className="text-primary">BC</span>
            </span>
          </Link>

          {/* Anchor links — hidden on mobile */}
          <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-primary transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className="text-[10px] font-bold uppercase tracking-widest border border-primary/50 text-primary px-5 py-2 rounded-full hover:bg-primary hover:text-black transition-all"
          >
            Login
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
        {/* Carousel Background Layer */}
        <HeroCarousel />
        
        {/* Content Layer (elevated z-index) */}
        <div className="relative z-20 flex flex-col items-center justify-center">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-10">
              Karakter &nbsp;·&nbsp; Prestasi &nbsp;·&nbsp; Kejuaraan
            </div>
          </FadeIn>

          <FadeIn delay={0.2} direction="up">
            <h1 className="font-heading text-gradient text-7xl md:text-9xl tracking-widest uppercase mb-3 leading-none">
              ADORA
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.3} direction="up">
            <p className="font-heading text-xl md:text-3xl tracking-[0.5em] uppercase text-white/40 mb-8">
              Basketball Club
            </p>
          </FadeIn>

          <FadeIn delay={0.4} direction="none">
            <div className="w-12 h-px bg-primary mb-8" />
          </FadeIn>

          <FadeIn delay={0.5} direction="up">
            <p className="text-sm md:text-base text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
              Klub basket untuk usia 7–18 tahun. Dari latihan rutin,
              sparing day, Camp ADORA, hingga KEJURKOT dan kompetisi nasional.
            </p>
          </FadeIn>

          <FadeIn delay={0.6} direction="up">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-primary text-black font-bold px-10 py-3.5 rounded-full hover:bg-primary/90 hover:shadow-[0_0_40px_rgba(212,175,55,0.35)] transition-all text-xs uppercase tracking-widest"
            >
              Login Anggota / Orang Tua
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="relative z-10 w-full border-y border-white/8 bg-primary/[0.04]">
        {/* dl/dt/dd — semantic untuk data statistik */}
        <StaggerContainer className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center" delay={0.15}>
          {STATS.map(({ value, label }) => (
            <StaggerItem key={label}>
              <dt className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] mb-1">
                {label}
              </dt>
              <dd className="font-heading text-2xl md:text-3xl text-primary tracking-widest">
                {value}
              </dd>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* ── Visi & Misi ── */}
      <section id="visi-misi" className="container mx-auto px-4 py-24 relative z-10">
        <FadeIn direction="up">
          <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-12 text-center">
            Visi & Misi
          </h2>
        </FadeIn>
        <StaggerContainer className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto" delay={0.2}>
          <StaggerItem className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-colors">
            <div className="text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Visi</div>
            <p className="text-white/70 leading-relaxed text-sm">
              Menjadi pusat pembinaan basket terdepan di Indonesia yang menghasilkan
              atlet berintegritas dan berprestasi.
            </p>
          </StaggerItem>
          <StaggerItem className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-colors">
            <div className="text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Misi</div>
            <ul className="space-y-3">
              {MISSION_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-white/70 text-sm leading-relaxed">
                  <span className="text-primary shrink-0 mt-0.5" aria-hidden="true">—</span>
                  {point}
                </li>
              ))}
            </ul>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* ── Program & Kelas ── */}
      <div className="relative z-10 w-full border-y border-white/8 bg-white/[0.025]">
        <section id="program" className="container mx-auto px-4 py-24">
          <FadeIn direction="up">
            <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-12 text-center">
              Program & Kelas
            </h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto" delay={0.2}>
            {PROGRAMS.map(({ label, ages, desc, icon }) => (
              <StaggerItem
                key={label}
                className="group bg-white/5 border border-white/10 hover:border-primary/40 rounded-2xl p-8 text-center transition-all duration-300 hover:bg-white/[0.08] hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(212,175,55,0.1)]"
              >
                <div className="text-4xl mb-5" aria-hidden="true">{icon}</div>
                <div className="font-heading text-4xl text-white tracking-widest mb-1 group-hover:text-primary transition-colors">
                  {label}
                </div>
                <div className="text-primary/60 text-[9px] font-bold uppercase tracking-[0.3em] mb-5">
                  {ages}
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </div>

      {/* ── Galeri Kegiatan ── */}
      <section id="galeri" className="container mx-auto px-4 py-24 relative z-10">
        <FadeIn direction="up">
          <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-12 text-center">
            Galeri Kegiatan
          </h2>
        </FadeIn>
        {/* TODO: Ganti dengan <Image /> dari /public saat foto tersedia */}
        <StaggerContainer className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto" delay={0.15}>
          {Array.from({ length: 3 }).map((_, i) => (
            <StaggerItem
              key={i}
              className="relative bg-[#111113] border border-primary/20 rounded-2xl h-56 overflow-hidden hover:border-primary/50 transition-all duration-500 hover:scale-[1.02]"
            >
              {/* Diagonal gold line pattern */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, rgba(212,175,55,0.07) 0px, rgba(212,175,55,0.07) 1px, transparent 1px, transparent 28px)",
                }}
              />
              {/* Top-right corner accent triangle */}
              <div
                className="absolute top-0 right-0 w-24 h-24 bg-primary/10"
                style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
              />
              {/* Bottom-left corner accent triangle */}
              <div
                className="absolute bottom-0 left-0 w-16 h-16 bg-primary/6"
                style={{ clipPath: "polygon(0 100%, 100% 100%, 0 0)" }}
              />
              {/* Watermark content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3">
                <span className="font-heading text-5xl tracking-widest" style={{ color: "rgba(212,175,55,0.12)" }} aria-hidden="true">
                  ADORA
                </span>
                <div className="w-8 h-px" style={{ background: "rgba(212,175,55,0.2)" }} />
                <span className="text-[9px] font-bold uppercase tracking-[0.4em]" style={{ color: "rgba(255,255,255,0.15)" }}>
                  Foto Segera Hadir
                </span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ── Jadwal Klub ── */}
      <div className="relative z-10 w-full border-y border-white/8 bg-white/[0.025]">
        <section id="jadwal" className="container mx-auto px-4 py-24">
          <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-12 text-center">
            Jadwal Klub
          </h2>
          <ClubSchedule initialEvents={events} />
        </section>
      </div>

      {/* ── Cara Mendaftar ── */}
      <section id="daftar" className="container mx-auto px-4 py-24 relative z-10">
        <FadeIn direction="up">
          <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-12 text-center">
            Cara Mendaftar
          </h2>
        </FadeIn>
        <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16" delay={0.2}>
          {REGISTRATION_STEPS.map(({ step, title, desc }) => (
            <StaggerItem key={step} className="text-center">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 border-2 border-primary mb-6 mx-auto">
                <span className="font-heading text-3xl text-primary">{step}</span>
              </div>
              <h3 className="font-heading text-xl text-white uppercase tracking-widest mb-3">
                {title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {desc}
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* CTA Button */}
        <FadeIn delay={0.6} direction="up" className="text-center">
          <a
            href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-4 rounded-full transition-all text-sm uppercase tracking-widest shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:scale-105"
          >
            <span>💬</span>
            Daftar Sekarang via WhatsApp
          </a>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0d0d0d]">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">

            {/* Brand */}
            <div className="max-w-xs">
              <Link href="/" className="font-heading text-3xl tracking-widest uppercase text-white block mb-3 hover:text-primary transition-colors">
                ADORA <span className="text-primary">BC</span>
              </Link>
              <p className="text-white/40 text-xs leading-relaxed">
                Membentuk generasi atlet basket berkarakter, berprestasi, dan siap
                bersaing di tingkat nasional.
              </p>
            </div>

            {/* Nav links */}
            <nav aria-label="Navigasi footer">
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mb-4">Navigasi</div>
              <ul className="space-y-2.5">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <a href={href} className="text-xs text-white/40 hover:text-primary transition-colors font-medium">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact — <address> adalah tag semantik untuk info kontak */}
            <address className="not-italic">
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mb-4">Kontak</div>
              <ul className="space-y-2.5 text-xs text-white/40 font-medium">
                <li>
                  <a href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    💬 {CONTACT_INFO.whatsapp}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-primary transition-colors">
                    📧 {CONTACT_INFO.email}
                  </a>
                </li>
                <li>
                  <a href="https://share.google/nWbXxpJTuJAEYR3xJ" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    📍 {CONTACT_INFO.address}
                  </a>
                </li>
                <li className="pt-2 border-t border-white/10 mt-2.5">
                  <a href="https://instagram.com/adorabbc" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    📸 {CONTACT_INFO.instagram}
                  </a>
                </li>
                <li>
                  <a href="https://tiktok.com/@adora_bbc" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    🎵 {CONTACT_INFO.tiktok}
                  </a>
                </li>
              </ul>
            </address>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-[10px] font-medium">
              &copy; {new Date().getFullYear()} ADORA Basketball Club &ndash; Semua hak cipta dilindungi.
            </p>
            <Link
              href="/login"
              className="text-[10px] font-bold uppercase tracking-widest text-primary/50 hover:text-primary transition-colors"
            >
              Login Portal →
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
