"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

const PLACEHOLDER_SLOTS = [{ label: "Momen Turnamen" }, { label: "Aksi Para Pemain" }, { label: "Atmosfer Pertandingan" }];

function CourtPattern() {
  return (
    <svg viewBox="0 0 200 150" className="absolute inset-0 w-full h-full text-primary/10 pointer-events-none" aria-hidden="true">
      <rect x="1" y="1" width="198" height="148" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="100" y1="1" x2="100" y2="149" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="75" r="20" stroke="currentColor" strokeWidth="1" fill="none" />
      <ellipse cx="15" cy="75" rx="10" ry="25" stroke="currentColor" strokeWidth="1" fill="none" />
      <ellipse cx="185" cy="75" rx="10" ry="25" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}

interface AutoFadeCarouselProps {
  images?: string[];
}

export function AutoFadeCarousel({ images }: AutoFadeCarouselProps) {
  const isPlaceholder = !images || images.length === 0;
  const slots = isPlaceholder ? PLACEHOLDER_SLOTS : images;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slots.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slots.length]);

  return (
    <div className="relative w-full aspect-4/3 rounded-3xl overflow-hidden bg-page-dark border border-white/10 shadow-2xl">
      {slots.map((slot, idx) => (
        <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          {isPlaceholder ? (
            <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-primary/5 flex flex-col items-center justify-center gap-4">
              <CourtPattern />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-primary/50" />
                </div>
                <span className="text-white/50 text-sm font-medium text-center px-4">{(slot as { label: string }).label}</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/50 border border-primary/20 px-3 py-1 rounded-full">Foto Segera Hadir</span>
              </div>
            </div>
          ) : (
            <Image src={slot as string} alt={`ASBC foto ${idx + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" quality={75} className="object-cover" />
          )}
        </div>
      ))}

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {slots.map((_, idx) => (
          <button key={idx} onClick={() => setCurrentIndex(idx)} className="p-2 -m-2 group min-w-12 min-h-12 flex items-center justify-center" aria-label={`Slide ${idx + 1}`}>
            <span className={`block h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? "bg-brand-yellow w-6" : "bg-white/30 w-1.5 group-hover:bg-white/50"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
