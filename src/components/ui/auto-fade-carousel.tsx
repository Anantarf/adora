"use client";

import { useState, useEffect } from "react";

const PLACEHOLDER_IMAGES = [
  "Slot Foto ASBC 1 (Turnamen)",
  "Slot Foto ASBC 2 (Pemain)",
  "Slot Foto ASBC 3 (Penonton/Atmosfer)",
];

interface AutoFadeCarouselProps {
  images?: string[];
}

export function AutoFadeCarousel({ images = PLACEHOLDER_IMAGES }: AutoFadeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative w-full aspect-[16/7] rounded-3xl overflow-hidden bg-page-dark/50 border border-white/10 shadow-2xl">
      {images.map((img, idx) => (
        <div
          key={img}
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <span className="text-white/30 text-sm font-bold uppercase tracking-[0.2em] border border-white/10 px-6 py-3 rounded-xl backdrop-blur-sm">
            {img}
          </span>
        </div>
      ))}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {images.map((img, idx) => (
          <button
            key={img}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === currentIndex ? "bg-primary w-6" : "bg-white/30 w-1.5 hover:bg-white/50"
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
