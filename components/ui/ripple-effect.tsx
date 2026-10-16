"use client";

import { useEffect } from "react";

// Elements that should get the ripple wave. Broad enough to cover buttons, category tabs,
// and menu/food item cards site-wide, but skips plain text links and disabled controls.
const RIPPLE_SELECTOR = 'button:not(:disabled), a[href], [role="button"], .ripple-target';

export function RippleEffect() {
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (e.button !== 0 && e.pointerType === "mouse") return; // left-click / any touch only

      const target = (e.target as HTMLElement)?.closest<HTMLElement>(RIPPLE_SELECTOR);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      // Reach the farthest corner so the wave always fully covers the element.
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      target.classList.add("ripple-host");
      const wave = document.createElement("span");
      wave.className = "ripple-wave";
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;
      target.appendChild(wave);

      wave.addEventListener("animationend", () => wave.remove(), { once: true });
      // Safety net in case animationend doesn't fire (e.g. element removed mid-animation).
      setTimeout(() => wave.remove(), 700);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return null;
}
