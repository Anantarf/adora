"use client";

import { motion, useReducedMotion } from "framer-motion";
import { createContext, ReactNode, useContext } from "react";

const ReducedMotionCtx = createContext(false);

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  duration?: number;
}

const DIRECTIONS = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export function FadeIn({ children, delay = 0, direction = "up", className = "", duration = 0.8 }: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, ...DIRECTIONS[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className = "", delay = 0.1 }: { children: ReactNode; className?: string; delay?: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ReducedMotionCtx.Provider value={!!shouldReduceMotion}>
      {shouldReduceMotion ? (
        <div className={className}>{children}</div>
      ) : (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: delay } },
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </ReducedMotionCtx.Provider>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reducedMotion = useContext(ReducedMotionCtx);

  if (reducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
