"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const SLIDE_INTERVAL_MS = 5000;

const BACKGROUNDS = [
  {
    id: 1,
    src: "/images/hero/adora-team-1.png",
    alt: "Pertandingan ADORA Basketball Club 1",
  },
  {
    id: 2,
    src: "/images/hero/adora-team-2.webp",
    alt: "Foto kegiatan ADORA Basketball Club",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const currentSlide = BACKGROUNDS[index];

  const nextSlide = useCallback(() => {
    setIndex((prev) => (prev + 1) % BACKGROUNDS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 bg-black flex items-center justify-center"
        >
          {/* Slide image */}
          <div className="absolute inset-0">
            <Image src={currentSlide.src} alt={currentSlide.alt} fill priority={index === 0} sizes="100vw" className="object-cover object-center" />
          </div>

          {/* Overlay readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/45 via-black/55 to-black/80" />
        </motion.div>
      </AnimatePresence>

      {/* Modern Gradient Overlays for Readability */}
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#0d0d0d] to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent z-10" />

      {/* Navigation Dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {BACKGROUNDS.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} className="group relative flex items-center justify-center p-2" aria-label={`Ke slide ${i + 1}`} aria-current={i === index}>
            <motion.div
              animate={{
                width: i === index ? 24 : 8,
                backgroundColor: i === index ? "rgba(212,175,55,1)" : "rgba(255,255,255,0.2)",
              }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="h-1.5 rounded-full"
            />
            {/* Hover Tooltip/Effect */}
            <div className="absolute -top-8 scale-0 group-hover:scale-100 transition-transform bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[8px] text-white uppercase tracking-tighter">Slide {i + 1}</div>
          </button>
        ))}
      </div>

      {/* Progress Bar (Visual Timer) */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-primary/30 z-20 w-full overflow-hidden">
        <motion.div key={index} initial={{ x: "-100%" }} animate={{ x: "0%" }} transition={{ duration: 5, ease: "linear" }} className="h-full bg-primary" />
      </div>
    </div>
  );
}
