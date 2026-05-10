import { FadeIn } from "@/components/animations/fade-in";
import { Camera } from "lucide-react";
import { GalleryHeroCarousel } from "@/components/features/gallery-hero-carousel";
import Image from "next/image";

function PhotoSlot({
  label,
  desc,
  image,
  color = "orange",
  className = "",
}: {
  label: string;
  desc: string;
  image?: string;
  color?: "orange" | "yellow";
  className?: string;
}) {
  const isYellow = color === "yellow";
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-surface-dark shadow-lg ${className} ${
        image 
          ? "border-black" 
          : `border-dashed ${isYellow ? "border-brand-yellow/40 hover:border-brand-yellow" : "border-brand-orange/40 hover:border-brand-orange"}`
      }`}
    >
      {image ? (
        <>
          <Image
            src={image}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Always visible gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {/* Caption — always visible, enhanced on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 group-hover:pb-5">
            <p className="font-heading font-black text-xs text-brand-yellow uppercase italic tracking-widest mb-1">{label}</p>
            <p className="text-white/70 text-[10px] leading-tight line-clamp-2 group-hover:text-white/90 transition-colors duration-300">{desc}</p>
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 pattern-halftone opacity-10 z-0" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 p-4 text-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isYellow ? "bg-brand-yellow/10 border border-brand-yellow/30" : "bg-brand-orange/10 border border-brand-orange/30"
            }`}>
              <Camera className={`w-4 h-4 opacity-70 ${isYellow ? "text-brand-yellow" : "text-brand-orange"}`} />
            </div>
            <p className={`font-heading font-black text-[10px] md:text-xs uppercase tracking-widest italic leading-tight ${
              isYellow ? "text-brand-yellow" : "text-brand-orange"
            }`}>
              {label}
            </p>
            <p className="text-white/35 text-[9px] md:text-[10px] font-medium leading-relaxed line-clamp-3 hidden sm:block max-w-[180px]">
              {desc}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export function GallerySection() {
  return (
    <section id="galeri" className="py-20 bg-page-dark relative z-20 overflow-hidden -mt-10 scroll-mt-20">
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn direction="up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-3 mb-3">
              <Camera className="w-7 h-7 text-brand-orange" />
              <h2 className="font-heading font-black text-3xl md:text-5xl text-white uppercase tracking-widest italic">
                ADORA IN ACTION
              </h2>
            </div>
            <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto font-medium">
              Kilas balik momen latihan, keseruan turnamen, dan semangat juang keluarga besar Adora BBC.
            </p>
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
        <div className="grid grid-cols-12 grid-rows-2 gap-3 md:gap-4 h-[460px] md:h-[560px]">

          {/* Slot 1 — Hero Carousel (Besar, 2 baris) */}
          <div className="col-span-12 md:col-span-5 row-span-2 group relative rounded-2xl overflow-hidden border-2 border-brand-yellow/40 hover:border-brand-yellow transition-all duration-300 bg-surface-dark shadow-xl">
            <GalleryHeroCarousel />
          </div>

          {/* Slot 2 — Foto Tim (kanan atas kiri) */}
          <PhotoSlot
            label="Adora Squad"
            desc="Wajah-wajah penuh talenta yang selalu siap memberikan performa terbaik."
            image="/images/gallery/team(3-2).jpg"
            color="orange"
            className="col-span-12 md:col-span-4 row-span-1"
          />

          {/* Slot 3 — Motivasi (kanan atas kanan) */}
          <PhotoSlot
            label="Momen Latihan"
            desc="Latihan rutin yang seru dan penuh semangat! Mulai dari asah skill dasar sampai sesi drill bareng pelatih."
            image="/images/gallery/drill.jpg"
            color="yellow"
            className="col-span-12 md:col-span-3 row-span-1"
          />

          {/* Slot 4 — Pengarahan & Evaluasi (kanan bawah kiri) */}
          <PhotoSlot
            label="Briefing & Evaluasi"
            desc="Potret anak-anak saat kumpul dan fokus menyimak masukan serta evaluasi dari pelatih."
            image="/images/gallery/latbrief.jpg"
            color="yellow"
            className="col-span-12 md:col-span-4 row-span-1"
          />

          {/* Slot 5 — Keceriaan (kanan bawah kanan) */}
          <PhotoSlot
            label="Keceriaan Tim"
            desc="Senyum dan tawa lepas anak-anak yang jadi bukti serunya kebersamaan di Adora."
            image="/images/gallery/keceriaan.JPG"
            color="orange"
            className="col-span-12 md:col-span-3 row-span-1"
          />

        </div>
      </div>
    </section>
  );
}
