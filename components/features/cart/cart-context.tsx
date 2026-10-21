"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartLine } from "@/types";

interface CartContextValue {
  lines: CartLine[];
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  removeItem: (menuItemId: number) => void;
  clearCart: () => void;
  /** Compare the cart with the live menu; fixes prices, drops unavailable items, returns what changed. */
  syncWithMenu: (menu: { id: number; name: string; price_pkr: number; is_available: number; image_url?: string }[]) => string[];
  itemCount: number;
  subtotal: number;
  lastAddedId: number | null;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "flaming-bites-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- must read localStorage after mount (SSR has none)
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback((item: Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.menu_item_id === item.menu_item_id);
      if (existing) {
        return prev.map((l) =>
          l.menu_item_id === item.menu_item_id ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { ...item, quantity }];
    });
    setLastAddedId(item.menu_item_id);
    window.setTimeout(() => setLastAddedId(null), 700);
  }, []);

  const updateQuantity = useCallback((menuItemId: number, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.menu_item_id !== menuItemId);
      return prev.map((l) => (l.menu_item_id === menuItemId ? { ...l, quantity } : l));
    });
  }, []);

  const removeItem = useCallback((menuItemId: number) => {
    setLines((prev) => prev.filter((l) => l.menu_item_id !== menuItemId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const syncWithMenu = useCallback(
    (menu: { id: number; name: string; price_pkr: number; is_available: number; image_url?: string }[]) => {
      const byId = new Map(menu.map((m) => [m.id, m]));
      const notices: string[] = [];
      const next: CartLine[] = [];
      for (const l of lines) {
        const m = byId.get(l.menu_item_id);
        if (!m || m.is_available !== 1) {
          notices.push(`${l.name} ab available nahi hai, cart se hata diya. / ${l.name} is no longer available and was removed.`);
          continue;
        }
        if (m.price_pkr !== l.price_pkr) {
          notices.push(`${l.name} ki qeemat badal gayi: PKR ${l.price_pkr} → PKR ${m.price_pkr}. / Price updated.`);
          next.push({ ...l, name: m.name, price_pkr: m.price_pkr, image_url: m.image_url ?? l.image_url });
        } else {
          // Keep name/photo current too (the owner may have renamed or re-photographed the dish).
          next.push({ ...l, name: m.name, image_url: m.image_url ?? l.image_url });
        }
      }
      if (notices.length || next.some((n, i) => n.name !== lines[i]?.name)) setLines(next);
      return notices;
    },
    [lines]
  );

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.price_pkr, 0);

  return (
    <CartContext.Provider
      value={{ lines, addItem, updateQuantity, removeItem, clearCart, syncWithMenu, itemCount, subtotal, lastAddedId }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
