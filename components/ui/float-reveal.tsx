"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

const SPRING_ENTER = {
  type: "spring" as const,
  stiffness: 100,
  damping: 16,
  mass: 0.8,
};

const SPRING_HOVER = {
  type: "spring" as const,
  stiffness: 300,
  damping: 22,
};

interface FloatRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Pixels to translate upward on enter */
  y?: number;
}

/**
 * FloatReveal — scroll-triggered levitation entrance.
 * Wraps any content. Cards, sections, images all use this.
 */
export function FloatReveal({
  children,
  delay = 0,
  className,
  y = 32,
}: FloatRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...SPRING_ENTER, delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * FloatCard — card that floats upward on hover with ambient shadow expansion.
 * Use for product cards, category tiles, testimonials.
 */
export function FloatCard({
  children,
  className,
  delay = 0,
  ...motionProps
}: FloatRevealProps & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...SPRING_ENTER, delay: delay / 1000 }}
      whileHover={{
        y: -8,
        boxShadow: "var(--shadow-float-hover)",
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

/**
 * FloatHero — entrance animation for hero content — faster, more dramatic.
 */
export function FloatHero({
  children,
  delay = 0,
  className,
}: FloatRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 14,
        delay: delay / 1000,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * FloatImage — parallax-like spring animation for hero images.
 */
export function FloatImage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      {children}
    </motion.div>
  );
}
