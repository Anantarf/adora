import Link from "next/link";
import { ArrowRight, Handshake, School, Trophy, Users } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { REGISTRATION_STEPS } from "@/lib/constants/landing";
import { CONTACT } from "@/lib/constants/contact";

const SCHOOL_PARTNERSHIP_POINTS = [
  {
    icon: School,
    title: "Program Sekolah",
    desc: "Sinergi ekskul, talent scouting, dan pembinaan terarah untuk siswa potensial.",
  },
  {
    icon: Users,
    title: "Klinik Dan Seleksi",
    desc: "Sesi coaching clinic, training camp, atau seleksi awal bersama tim Adora.",
  },
  {
    icon: Trophy,
    title: "Akses Kompetisi",
    desc: "Jalur lanjutan menuju turnamen pelajar dan pembinaan klub yang lebih kompetitif.",
  },
];

export function LandingCtaSection() {
  return (
    <section id="daftar" className="relative z-20 overflow-hidden bg-brand-purple py-14 scroll-mt-20 md:py-24">
      <div className="pointer-events-none absolute inset-0 pattern-halftone opacity-20" />

      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 -mr-48 -mt-48 bg-brand-orange/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -mb-40 -ml-40 bg-brand-yellow/10 blur-[100px]" />

      <div className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden opacity-10">
        <div className="absolute left-[10%] top-[-10%] h-[120%] w-0.5 rotate-45 bg-brand-orange" />
        <div className="absolute left-[15%] top-[-10%] h-[120%] w-px rotate-45 bg-white" />
        <div className="absolute right-[10%] top-[-10%] h-[120%] w-px rotate-45 bg-brand-yellow" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-8 lg:gap-12">
          <div className="flex flex-col items-start text-left lg:col-span-5">
            <FadeIn direction="up">
              <h2 className="mb-3 font-heading text-2xl font-black uppercase tracking-widest text-white italic drop-shadow-lg md:text-5xl leading-tight">
                SIAP MENJADI <span className="text-brand-yellow">JUARA?</span>
              </h2>
              <p className="mb-8 text-sm font-medium leading-relaxed text-white/90 md:text-base">
                Pendaftaran mudah, cepat, dan 100% online.
              </p>

              <StaggerContainer className="mb-10 flex w-full flex-col gap-5" delay={0.2}>
                {REGISTRATION_STEPS.map(({ step, title, desc }) => (
                  <StaggerItem key={step} className="group flex items-start gap-4">
                    <div className="shrink-0 pt-0.5 font-heading text-2xl font-black text-brand-orange italic drop-shadow-sm transition-transform group-hover:scale-110 md:text-3xl">
                      0{step}
                    </div>
                    <div className="text-left">
                      <h3 className="mb-1.5 font-heading text-sm font-black uppercase tracking-widest text-white italic leading-none transition-colors group-hover:text-brand-yellow">
                        {title}
                      </h3>
                      <p className="max-w-xl text-xs font-medium leading-relaxed text-white/60">
                        {desc}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <Link href="/register" className="group inline-flex skew-box border-2 border-black bg-brand-yellow px-10 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-black shadow-[6px_6px_0px_#000] transition-all hover:scale-110 hover:bg-white md:text-base">
                  <span className="unskew-content flex items-center gap-3 italic">
                    DAFTAR SEKARANG
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Kuota terbatas untuk setiap kelompok usia
                  </p>
                  <div className="h-1 w-12 rounded-full bg-brand-orange/40" />
                </div>
              </div>
            </FadeIn>
          </div>

          <div className="w-full lg:col-span-3">
            <FadeIn direction="up">
              <div className="group relative">
                <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-card bg-brand-yellow transition-transform duration-300 group-hover:translate-x-4 group-hover:translate-y-4" />

                <div className="relative overflow-hidden rounded-card border-2 border-black bg-surface-dark shadow-[8px_8px_0px_#000] transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="pointer-events-none absolute inset-0 pattern-halftone opacity-10" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-brand-orange/20 to-transparent" />

                  <div className="relative z-10 flex flex-col gap-6 p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="inline-flex skew-box border-2 border-black bg-brand-orange px-3 py-1 shadow-[3px_3px_0px_#000]">
                        <span className="unskew-content block font-heading text-[10px] font-black uppercase tracking-[0.2em] text-black italic">
                          SCHOOL PARTNERSHIP
                        </span>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/10 bg-black/40 text-brand-yellow">
                        <Handshake className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-heading text-2xl font-black uppercase tracking-widest text-white italic leading-tight md:text-3xl">
                        Jalur Resmi
                        <br />
                        <span className="text-brand-yellow">Kemitraan Sekolah</span>
                      </h3>
                      <p className="max-w-sm text-sm font-medium leading-relaxed text-white/75">
                        Untuk sekolah yang ingin punya jalur pembinaan basket yang lebih serius, rapi, dan terhubung langsung ke ekosistem kompetisi Adora.
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {SCHOOL_PARTNERSHIP_POINTS.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition-colors group-hover:border-white/15">
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-black">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-heading text-xs font-black uppercase tracking-widest text-white italic">{title}</p>
                            <p className="mt-1 text-xs font-medium leading-relaxed text-white/60">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <a
                      href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
                        "Halo Adora BBC, sekolah kami tertarik untuk bekerja sama dalam program kemitraan penyaluran dan pembinaan bakat olahraga bola basket siswa kami ke klub."
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-12 w-full skew-box items-center justify-center gap-3 border-2 border-black bg-linear-to-r from-brand-orange to-orange-700 px-5 py-3 text-center text-[10px] font-black uppercase tracking-[0.24em] text-white shadow-[5px_5px_0px_#000] transition-all hover:scale-[1.02] hover:from-brand-yellow hover:to-brand-orange hover:text-black"
                    >
                      <span className="unskew-content flex items-center gap-2 italic">
                        Hubungi Untuk Kemitraan
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
