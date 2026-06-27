import { FadeIn } from "@/components/animations/fade-in";
import { Camera } from "lucide-react";
import { GalleryHeroCarousel } from "@/components/features/gallery-hero-carousel";
import Image from "next/image";

function PhotoSlot({ label, desc, image, color = "orange", className = "" }: { label: string; desc: string; image?: string; color?: "orange" | "yellow"; className?: string }) {
  const isYellow = color === "yellow";
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-surface-dark shadow-lg ${className} ${
        image ? "border-black" : `border-dashed ${isYellow ? "border-brand-yellow/40 hover:border-brand-yellow" : "border-brand-orange/40 hover:border-brand-orange"}`
      }`}
    >
      {image ? (
        <>
          <Image src={image} alt={label} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw" quality={75} className="object-cover opacity-95 transition-transform duration-700 group-hover:scale-105" />
          {/* Always visible gradient */}
          <div className="absolute inset-0 bg-linear-to-t from-black/84 via-black/20 to-transparent" />
          {/* Caption — always visible, enhanced on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 group-hover:pb-5">
            <p className="font-heading font-black text-sm md:text-base text-brand-yellow uppercase italic tracking-wide md:tracking-widest mb-1">{label}</p>
            <p className="text-white/75 text-sm md:text-base leading-snug line-clamp-2 group-hover:text-white/90 transition-colors duration-300 text-pretty">{desc}</p>
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 pattern-halftone opacity-10 z-0" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 p-4 text-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isYellow ? "bg-brand-yellow/10 border border-brand-yellow/30" : "bg-brand-orange/10 border border-brand-orange/30"}`}>
              <Camera className={`w-4 h-4 opacity-70 ${isYellow ? "text-brand-yellow" : "text-brand-orange"}`} />
            </div>
            <p className={`font-heading font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wide md:tracking-widest italic leading-tight ${isYellow ? "text-brand-yellow" : "text-brand-orange"}`}>{label}</p>
            <p className="text-white/50 text-[10px] md:text-xs font-medium leading-relaxed line-clamp-3 hidden sm:block max-w-45 text-pretty">{desc}</p>
          </div>
        </>
      )}
    </div>
  );
}

export function GallerySection() {
  return (
    <section id="galeri" className="pt-10 pb-16 md:pt-16 md:pb-24 bg-page-dark relative z-20 overflow-hidden -mt-8 md:-mt-10 scroll-mt-20">
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn direction="up">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <Camera className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
              <h2 className="text-h2 text-white uppercase text-balance">GALERI ADORA</h2>
            </div>
            <p className="text-white/70 text-body-lg max-w-2xl mx-auto text-pretty">Kilas balik momen latihan, keseruan turnamen, dan semangat juang keluarga besar Adora BBC.</p>
          </div>
        </FadeIn>

        {/*
          Bento Grid — 5 Slot — Full Width
          ┌─────────────────────┬──────────────┬──────────┐
          │                     │  Latihan     │ Candid   │
          │    FOTO UTAMA       │  Harian      │ Pemain   │
          │    (row 1+2)        ├──────────────┼──────────┤
          │                     │  Panoramik   │  Aksi    │
          │                     │  Lapangan    │ Turnamen │
          └─────────────────────┴──────────────┴──────────┘
        */}
        <div className="grid grid-cols-12 md:grid-rows-2 gap-4 md:gap-4 h-auto md:h-[35rem]">
          {/* Slot 1 — Hero Carousel (Besar, 2 baris) */}
          <div className="col-span-12 md:col-span-5 md:row-span-2 h-64 sm:h-80 md:h-full group relative rounded-2xl overflow-hidden border-2 border-brand-yellow/40 hover:border-brand-yellow transition-all duration-300 bg-surface-dark shadow-xl">
            <GalleryHeroCarousel />
          </div>

          {/* Slot 2 — Foto Tim (kanan atas kiri) */}
          <PhotoSlot label="Tim Berbakat" desc="Atlet-atlet muda penuh potensi yang berdedikasi mengasah kemampuan bermain basket." image="/images/gallery/team(3-2).jpg" color="orange" className="col-span-12 md:col-span-4 row-span-1 h-44 md:h-full" />

          {/* Slot 3 — Motivasi (kanan atas kanan) */}
          <PhotoSlot
            label="Momen Latihan"
            desc="Latihan rutin yang seru dan penuh semangat! Mulai dari asah skill dasar sampai sesi drill bareng pelatih."
            image="/images/gallery/drill.jpg"
            color="yellow"
            className="col-span-12 md:col-span-3 row-span-1 h-44 md:h-full"
          />

          {/* Slot 4 — Pengarahan & Evaluasi (kanan bawah kiri) */}
          <PhotoSlot
            label="Briefing & Evaluasi"
            desc="Potret anak-anak saat kumpul dan fokus menyimak masukan serta evaluasi dari pelatih."
            image="/images/gallery/latbrief.jpg"
            color="yellow"
            className="col-span-12 md:col-span-4 row-span-1 h-44 md:h-full"
          />

          {/* Slot 5 — Kebersamaan (kanan bawah kanan) */}
          <PhotoSlot
            label="Semangat Kebersamaan"
            desc="Momen kebersamaan tim yang menunjukkan ikatan kuat antara pemain dan pelatih."
            image="/images/gallery/keceriaan.JPG"
            color="orange"
            className="col-span-12 md:col-span-3 row-span-1 h-44 md:h-full"
          />
        </div>
      </div>
    </section>
  );
}
