"use client";

import { useState, useEffect } from "react";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const GALLERY_SLIDES = [
  {
    label: "Laga Kejurkot",
    desc: "Momen krusial penyusunan strategi dan semangat pantang menyerah tim Adora saat berlaga di ajang Kejurkot.",
    color: "brand-yellow",
    image: "/images/gallery/kejurkot.jpg",
  },
  {
    label: "Aksi di Lapangan",
    desc: "Keseruan dan intensitas para pemain saat bertanding, memberikan yang terbaik di setiap menitnya.",
    color: "brand-orange",
    image: "/images/gallery/carousel2.jpg",
  },
  {
    label: "Sparring Match",
    desc: "Uji taktik dan strategi di lapangan melalui sesi tanding melawan tim Buls.",
    color: "brand-yellow",
    image: "/images/gallery/hero1.jpg",
  },
];

export function GalleryHeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % GALLERY_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [current]);

  function goTo(idx: number) {
    if (transitioning || idx === current) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setTransitioning(false);
    }, 300);
  }

  const slide = GALLERY_SLIDES[current];

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Slide Content */}
      <div
        className={`flex-1 relative flex flex-col items-center justify-center gap-4 p-6 md:p-8 text-center transition-opacity duration-300 ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {slide.image ? (
          <>
            {/* Real Photo Background */}
            <Image
              src={slide.image}
              alt={slide.label}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover object-center"
              priority
            />
            {/* Gradient overlay so text is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
            {/* Caption on hover or always at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
              <p className={`text-brand-yellow font-heading font-black text-sm md:text-base uppercase tracking-widest italic mb-1`}>
                {slide.label}
              </p>
              <p className="text-white/70 text-[11px] leading-relaxed line-clamp-2">
                {slide.desc}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 pattern-halftone opacity-20 z-0" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-${slide.color}/10 border-2 border-${slide.color}/30 flex items-center justify-center`}>
                <Camera className={`w-7 h-7 text-${slide.color} opacity-80`} />
              </div>
              <p className={`text-${slide.color} font-heading font-black text-base md:text-xl uppercase tracking-widest italic`}>
                {slide.label}
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 max-w-[220px]">
                <p className="text-white/50 text-xs font-medium leading-relaxed">
                  {slide.desc}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-black/30 backdrop-blur-sm">
        <button
          onClick={() => goTo((current - 1 + GALLERY_SLIDES.length) % GALLERY_SLIDES.length)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Slide sebelumnya"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {GALLERY_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-400 ${
                idx === current ? "bg-brand-yellow w-5" : "bg-white/30 w-1.5 hover:bg-white/50"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => goTo((current + 1) % GALLERY_SLIDES.length)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Slide berikutnya"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
