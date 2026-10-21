"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-context";

/**
 * Cart pages call this once. A cart can be hours (or days) old: the owner may have changed a
 * price or sold out a dish since. We re-check against the live menu and tell the customer
 * what changed BEFORE they pay, instead of failing at the last step.
 */
export function useCartSync() {
  const { lines, syncWithMenu } = useCart();
  const [notices, setNotices] = useState<string[]>([]);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || lines.length === 0) return;
    done.current = true;
    fetch("/api/menu", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.items)) setNotices(syncWithMenu(d.items));
      })
      .catch(() => {
        done.current = false; // offline: try again next time the page is shown
      });
  }, [lines.length, syncWithMenu]);

  return { notices, dismiss: () => setNotices([]), refresh: async () => {
    const d = await fetch("/api/menu", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (d && Array.isArray(d.items)) setNotices(syncWithMenu(d.items));
  } };
}
