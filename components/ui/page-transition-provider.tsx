"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PageTransitionProvider() {
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Let the browser handle new-tab / download / modifier-key clicks normally.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download") || anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return; // external link
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // same page

      if (typeof document.startViewTransition !== "function") return; // unsupported browser

      e.preventDefault();
      document.startViewTransition(() => {
        router.push(href);
        // The router navigation itself is async (RSC fetch + render), which the View
        // Transitions API has no way to await directly. Two frames gives React a couple
        // of paint cycles to start rendering the new route before the "after" snapshot
        // is captured — a pragmatic, widely-used approach until Next.js/React expose a
        // navigation-complete signal for this API.
        return new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [router]);

  return null;
}
