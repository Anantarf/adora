"use client";

import { useEffect, useRef } from "react";

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: {
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
      isGold: boolean;
      twinkleSpeed: number;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      // 1 star per 6000 pixels (not too crowded, very elegant)
      const numStars = Math.floor((canvas.width * canvas.height) / 6000); 
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.2, // Tiny specs to noticeable stars
          speed: Math.random() * 0.3 + 0.05, // Very slow drifting
          opacity: Math.random(),
          isGold: Math.random() > 0.7, // 30% of stars are Adora Gold
          twinkleSpeed: (Math.random() - 0.5) * 0.03, // fade in/out
        });
      }
    };

    const draw = () => {
      // Clear canvas on each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        
        // Pure Gold (#D4AF37) vs Soft White
        const rgb = star.isGold ? "212, 175, 55" : "250, 250, 250";
        ctx.fillStyle = `rgba(${rgb}, ${star.opacity})`;
        ctx.fill();

        // 1. Move upwards slowly
        star.y -= star.speed;
        // Optionally drift a tiny bit sideways
        star.x += (Math.random() - 0.5) * 0.05;
        
        // 2. Twinkle effect (breathing opacity)
        star.opacity += star.twinkleSpeed;
        if (star.opacity < 0.1) {
          star.opacity = 0.1;
          star.twinkleSpeed = Math.abs(star.twinkleSpeed); // Force positive (fade in)
        } else if (star.opacity > 1) {
          star.opacity = 1;
          star.twinkleSpeed = -Math.abs(star.twinkleSpeed); // Force negative (fade out)
        }

        // 3. Reset to bottom if it floats out of screen (top)
        if (star.y < 0) {
          star.y = canvas.height + 10;
          star.x = Math.random() * canvas.width;
          star.opacity = 0.1; // reset to lowest visible opacity so it fades up
          star.twinkleSpeed = Math.abs(star.twinkleSpeed); // Ensure it starts fading in
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-80 mix-blend-screen"
    />
  );
}
