"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Scroll-reveal animations done with a tiny IntersectionObserver + CSS (see .reveal in
// globals.css). This replaced framer-motion, which added ~50KB of JavaScript to every
// public page — a real cost for customers on slow mobile data.

interface FloatRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Pixels to translate upward on enter */
  y?: number;
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Scroll-triggered entrance. Wraps any content. */
export function FloatReveal({ children, delay = 0, className, y = 32 }: FloatRevealProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={{ "--y": `${y}px`, "--d": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Card that fades in on scroll and lifts on hover. Accepts normal div props (onClick, …). */
export function FloatCard({
  children,
  className,
  delay = 0,
  style,
  ...rest
}: FloatRevealProps & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn("reveal lift", className)}
      style={{ "--y": "24px", "--d": `${delay}ms`, ...style } as React.CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Hero entrance — pure CSS animation, no JavaScript needed. */
export function FloatHero({ children, delay = 0, className }: FloatRevealProps) {
  return (
    <div className={cn("hero-in", className)} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}
