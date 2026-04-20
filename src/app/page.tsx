import Link from "next/link";
import { Starfield } from "@/components/ui/starfield";
import { getPublicHomebases } from "@/actions/homebase";
import { Metadata } from "next";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { HomebaseSection } from "@/components/features/homebase-section";

export const metadata: Metadata = {
  // ... existing Metadata & Constants ...
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

const NAV_LINKS = [
  { label: "Visi & Misi", href: "#visi-misi" },
  { label: "Program", href: "#program" },
  { label: "Galeri", href: "#galeri" },
  { label: "Lokasi", href: "#lokasi" },
  { label: "Daftar", href: "#daftar" },
];

const STATS = [
  { value: "100+", label: "Pemain Aktif" },
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
    desc: "Fondasi teknik dan ball-handling yang kuat. Pemain mulai dikenalkan pada sistem latihan terstruktur khas ADORA.",
    icon: "🌱",
  },
  {
    label: "KU‑15",
    ages: "13 – 15 Tahun",
    desc: "Pengembangan taktik, fisik, dan mental kompetisi. Pemain aktif mengikuti sparing day, ASBC, dan Liga Basket Depok.",
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
    desc: "Lengkapi data pemain dan orang tua, termasuk fotocopy identitas.",
  },
  {
    step: "3",
    title: "Konfirmasi & Mulai",
    desc: "Setelah konfirmasi, pemain siap mengikuti latihan rutin di Home Court.",
  },
];

const CONTACT_INFO = {
  whatsapp: "6281213043753",
  email: "admin@adora.club",
  address: "Home Court, Cinere-Depok",
  instagram: "@adorabbc",
  tiktok: "adora_bbc",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const homebases = await getPublicHomebases();

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white relative overflow-hidden">
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
              <a key={href} href={href} className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-primary transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest border border-primary/50 text-primary px-5 py-2 rounded-full hover:bg-primary hover:text-black transition-all">
            Login
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
        {/* Content Layer (elevated z-index) */}
        <div className="relative z-20 flex flex-col items-center justify-center">
          <FadeIn delay={0.2} direction="up">
            <h1 className="font-heading text-gradient text-4xl md:text-6xl tracking-[0.2em] uppercase mb-6 leading-tight text-center">Adora Basketball Club</h1>
          </FadeIn>

          <FadeIn delay={0.3} direction="up">
            <p className="font-heading text-lg md:text-xl text-secondary tracking-widest uppercase mb-4 drop-shadow-md italic">"Sport Fun and Friendship"</p>
          </FadeIn>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="relative z-10 w-full border-y border-white/8 bg-primary/4">
        {/* dl/dt/dd — semantic untuk data statistik */}
        <StaggerContainer className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center" delay={0.15}>
          {STATS.map(({ value, label }) => (
            <StaggerItem key={label}>
              <dt className="text-white/25 text-[9px] font-bold uppercase tracking-[0.3em] mb-1">{label}</dt>
              <dd className="font-heading text-2xl md:text-3xl text-primary tracking-widest">{value}</dd>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* ── Visi & Misi ── */}
      <section id="visi-misi" className="container mx-auto px-4 py-24 relative z-10">
        <FadeIn direction="up">
          <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-12 text-center">Visi & Misi</h2>
        </FadeIn>
        <StaggerContainer className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto" delay={0.2}>
          <StaggerItem className="bg-white/[0.025]/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.025]/[0.08] transition-colors">
            <div className="text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Visi</div>
            <p className="text-white/50 leading-relaxed text-sm">Menjadi pusat pembinaan basket terdepan di Indonesia yang menghasilkan pemain berintegritas dan berprestasi.</p>
          </StaggerItem>
          <StaggerItem className="bg-white/[0.025]/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.025]/[0.08] transition-colors">
            <div className="text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Misi</div>
            <ul className="space-y-3">
              {MISSION_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-white/50 text-sm leading-relaxed">
                  <span className="text-primary shrink-0 mt-0.5" aria-hidden="true">
                    —
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* ── Program & Kelas ── */}
      <div className="relative z-10 w-full border-y border-white/8 bg-white/2.5">
        <section id="program" className="container mx-auto px-4 py-24">
          <FadeIn direction="up">
            <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-12 text-center">Program & Kelas</h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto" delay={0.2}>
            {PROGRAMS.map(({ label, ages, desc, icon }) => (
              <StaggerItem
                key={label}
                className="group bg-white/[0.025]/5 border border-white/10 hover:border-primary/40 rounded-2xl p-8 text-center transition-all duration-base hover:bg-white/[0.025]/[0.08] hover:-translate-y-2 hover:shadow-primary-soft"
              >
                <div className="text-4xl mb-5" aria-hidden="true">
                  {icon}
                </div>
                <div className="font-heading text-4xl text-white tracking-widest mb-1 group-hover:text-primary transition-colors">{label}</div>
                <div className="text-primary/60 text-[9px] font-bold uppercase tracking-[0.3em] mb-5">{ages}</div>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </div>

      {/* ── Galeri Kegiatan ── */}
      <section id="galeri" className="container mx-auto px-4 py-24 relative z-10">
        <FadeIn direction="up">
          <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-12 text-center">Galeri Kegiatan</h2>
        </FadeIn>
        {/* TODO: Ganti dengan <Image /> dari /public saat foto tersedia */}
        <StaggerContainer className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto" delay={0.15}>
          {Array.from({ length: 3 }).map((_, i) => (
            <StaggerItem key={i} className="relative bg-surface-dark border border-primary/20 rounded-2xl h-56 overflow-hidden hover:border-primary/50 transition-all duration-500 hover:scale-[1.02]">
              {/* Diagonal gold line pattern */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "repeating-linear-gradient(135deg, rgba(212,175,55,0.07) 0px, rgba(212,175,55,0.07) 1px, transparent 1px, transparent 28px)",
                }}
              />
              {/* Top-right corner accent triangle */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
              {/* Bottom-left corner accent triangle */}
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/6" style={{ clipPath: "polygon(0 100%, 100% 100%, 0 0)" }} />
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

      {/* ── Lokasi Homebase ── */}
      {homebases.length > 0 && (
        <div id="lokasi" className="relative z-10">
          <HomebaseSection homebases={homebases} />
        </div>
      )}

      {/* ── Cara Mendaftar ── */}
      <section id="daftar" className="container mx-auto px-4 py-24 relative z-10">
        <FadeIn direction="up">
          <h2 className="font-heading text-4xl text-primary uppercase tracking-widest mb-12 text-center">Cara Mendaftar</h2>
        </FadeIn>
        <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16" delay={0.2}>
          {REGISTRATION_STEPS.map(({ step, title, desc }) => (
            <StaggerItem key={step} className="text-center">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 border-2 border-primary mb-6 mx-auto">
                <span className="font-heading text-3xl text-primary">{step}</span>
              </div>
              <h3 className="font-heading text-xl text-white uppercase tracking-widest mb-3">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Pricing & Integration */}
        <FadeIn delay={0.4} direction="up" className="max-w-3xl mx-auto mb-16 bg-white/[0.025]/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="font-heading text-2xl text-primary tracking-widest uppercase">Biaya & Iuran</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-white/80">
                  <span>
                    Pendaftaran <span className="text-white/60 text-xs">(Termasuk Iuran Bln 1)</span>
                  </span>
                  <span className="font-bold text-lg">Rp 470.000</span>
                </div>
                <div className="flex justify-between items-center text-white/80">
                  <span>Iuran Bulanan</span>
                  <span className="font-bold text-lg">Rp 350.000</span>
                </div>
              </div>
            </div>
            <div className="md:border-l border-white/10 md:pl-8 space-y-4">
              <h3 className="font-heading text-xl text-primary tracking-widest uppercase">Pembayaran</h3>
              <div className="bg-[#111113] border border-primary/20 rounded-xl p-4">
                <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Transfer Bank</p>
                <p className="font-bold text-white text-lg">BNI 1227456425</p>
                <p className="text-sm text-white/80">a.n. Dodi Aminullah</p>
              </div>
              <p className="text-xs text-white/50 italic text-center">* Pembayaran tunai juga dapat dilakukan saat jadwal latihan.</p>
            </div>
          </div>
        </FadeIn>

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
              <p className="text-white/60 text-xs leading-relaxed">Membentuk pemain basket berkarakter, berprestasi, dan siap bersaing — dari Depok untuk Indonesia.</p>
            </div>

            {/* Nav links */}
            <nav aria-label="Navigasi footer">
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mb-4">Navigasi</div>
              <ul className="space-y-2.5">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <a href={href} className="text-xs text-white/60 hover:text-primary transition-colors font-medium">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact — <address> adalah tag semantik untuk info kontak */}
            <address className="not-italic">
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mb-4">Kontak</div>
              <ul className="space-y-2.5 text-xs text-white/60 font-medium">
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
            <p className="text-white/25 text-[10px] font-medium">&copy; {new Date().getFullYear()} ADORA Basketball Club &ndash; Semua hak cipta dilindungi.</p>
            <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest text-primary/50 hover:text-primary transition-colors">
              Login Portal →
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
