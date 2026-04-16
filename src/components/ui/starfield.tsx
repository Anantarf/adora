"use client";

import { useEffect, useRef } from "react";

const MOBILE_BREAKPOINT = 768;
const DESKTOP_STAR_DENSITY = 6000;
const MOBILE_STAR_DENSITY = 9000;
const MAX_DPR = 1.5;

type Star = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  isGold: boolean;
  twinkleSpeed: number;
};

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let isTabVisible = document.visibilityState === "visible";
    let isAnimating = false;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let stars: Star[] = [];

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const initStars = () => {
      stars = [];
      const density = viewportWidth < MOBILE_BREAKPOINT ? MOBILE_STAR_DENSITY : DESKTOP_STAR_DENSITY;
      const numStars = Math.floor((viewportWidth * viewportHeight) / density);

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * viewportWidth,
          y: Math.random() * viewportHeight,
          radius: Math.random() * 1.5 + 0.2,
          speed: Math.random() * 0.3 + 0.05,
          opacity: Math.random(),
          isGold: Math.random() > 0.7,
          twinkleSpeed: (Math.random() - 0.5) * 0.03,
        });
      }
    };

    const resize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.floor(viewportWidth * dpr);
      canvas.height = Math.floor(viewportHeight * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initStars();

      if (prefersReducedMotion) {
        render(false);
      }
    };

    const render = (withMotion: boolean) => {
      ctx.clearRect(0, 0, viewportWidth, viewportHeight);

      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

        const rgb = star.isGold ? "212, 175, 55" : "250, 250, 250";
        ctx.fillStyle = `rgba(${rgb}, ${star.opacity})`;
        ctx.fill();

        if (!withMotion) {
          return;
        }

        star.y -= star.speed;
        star.x += (Math.random() - 0.5) * 0.05;

        star.opacity += star.twinkleSpeed;
        if (star.opacity < 0.1) {
          star.opacity = 0.1;
          star.twinkleSpeed = Math.abs(star.twinkleSpeed);
        } else if (star.opacity > 1) {
          star.opacity = 1;
          star.twinkleSpeed = -Math.abs(star.twinkleSpeed);
        }

        if (star.y < 0) {
          star.y = viewportHeight + 10;
          star.x = Math.random() * viewportWidth;
          star.opacity = 0.1;
          star.twinkleSpeed = Math.abs(star.twinkleSpeed);
        }
      });
    };

    const draw = () => {
      if (!isTabVisible || prefersReducedMotion) {
        isAnimating = false;
        return;
      }

      render(true);
      animationFrameId = requestAnimationFrame(draw);
      isAnimating = true;
    };

    const stopAnimation = () => {
      if (isAnimating) {
        cancelAnimationFrame(animationFrameId);
        isAnimating = false;
      }
    };

    const startAnimation = () => {
      if (!isAnimating) {
        draw();
      }
    };

    const handleVisibilityChange = () => {
      isTabVisible = document.visibilityState === "visible";

      if (!isTabVisible) {
        stopAnimation();
        return;
      }

      if (prefersReducedMotion) {
        render(false);
        return;
      }

      startAnimation();
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;

      if (prefersReducedMotion) {
        stopAnimation();
        render(false);
        return;
      }

      if (isTabVisible) {
        startAnimation();
      }
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    resize();
    if (prefersReducedMotion) {
      render(false);
    } else {
      startAnimation();
    }

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      stopAnimation();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80 mix-blend-screen" />;
}
