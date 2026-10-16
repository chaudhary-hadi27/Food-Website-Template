"use client";

import { useEffect, useState } from "react";

const EXIT_DURATION_MS = 200;

/**
 * Wraps any modal/dialog content with a smooth scale-in on open and scale-out on close
 * (Bezier easing, slight overshoot) plus a blurred backdrop that locks focus to the center.
 * Handles the unmount delay itself — pass `open` straight from your existing boolean state,
 * no other changes needed.
 */
export function AnimatedModal({
  open,
  onClose,
  children,
  panelClassName = "",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- standard enter-transition mount pattern
      setMounted(true);
      // Two RAFs: one to let the "hidden" starting styles actually paint, one to flip
      // to "visible" so the browser has something to transition *from*.
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
    if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), EXIT_DURATION_MS);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ease-out ${
        visible ? "bg-black/70 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none"
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        } ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
