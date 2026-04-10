"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BACKGROUNDS = [
  { 
    id: 1, 
    label: "Karakter", 
    color: "from-blue-900/20 via-black to-black",
  },
  { 
    id: 2, 
    label: "Prestasi", 
    color: "from-orange-900/20 via-black to-black",
  },
  { 
    id: 3, 
    label: "Integritas", 
    color: "from-purple-900/20 via-black to-black",
  },
  { 
    id: 4, 
    label: "Juara", 
    color: "from-emerald-900/20 via-black to-black",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setIndex((prev) => (prev + 1) % BACKGROUNDS.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
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
          {/* Slide Content */}
          <div className={`absolute inset-0 bg-gradient-to-br ${BACKGROUNDS[index].color} flex items-center justify-center`}>
            {/* Background Stylized Text */}
            <span className="text-white/[0.03] font-heading text-[12rem] md:text-[20rem] tracking-tighter select-none uppercase leading-none">
              {BACKGROUNDS[index].label}
            </span>
          </div>

          {/* Constant Texture/Mesh Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.2] mix-blend-overlay"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)",
              backgroundSize: "32px 32px"
            }}
          />
        </motion.div>
      </AnimatePresence>


      {/* Modern Gradient Overlays for Readability */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0d0d0d] to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent z-10" />

      {/* Navigation Dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {BACKGROUNDS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="group relative flex items-center justify-center p-2"
            aria-label={`Ke slide ${i + 1}`}
          >
            <motion.div 
              animate={{ 
                width: i === index ? 24 : 8,
                backgroundColor: i === index ? "rgba(212,175,55,1)" : "rgba(255,255,255,0.2)"
              }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="h-1.5 rounded-full"
            />
            {/* Hover Tooltip/Effect */}
            <div className="absolute -top-8 scale-0 group-hover:scale-100 transition-transform bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[8px] text-white uppercase tracking-tighter">
              Slide {i + 1}
            </div>
          </button>
        ))}
      </div>

      {/* Progress Bar (Visual Timer) */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-primary/30 z-20 w-full overflow-hidden">
        <motion.div
          key={index}
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 5, ease: "linear" }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
}
