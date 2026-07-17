"use client";

import { useEffect, useRef, useState } from "react";

export function Parallax({ children, strength = 0.15 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    function handleScroll() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      // Only apply while the element is near the top of the viewport (hero area).
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setOffset(window.scrollY * strength);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [strength]);

  return (
    <div ref={ref} className="overflow-hidden">
      <div style={{ transform: `translateY(${offset}px)`, transition: "transform 0.1s linear" }}>{children}</div>
    </div>
  );
}
