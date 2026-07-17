"use client";

import Link from "next/link";
import { useCart } from "@/components/features/cart/cart-context";
import { formatPKR } from "@/lib/utils";

export function FloatingCartBar() {
  const { itemCount, subtotal } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-fade-up sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      <Link
        href="/cart"
        className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--color-text-primary)] px-5 py-4 text-white shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            {itemCount}
          </span>
          <div className="text-sm">
            <p className="font-medium">{itemCount === 1 ? "1 item" : `${itemCount} items`}</p>
            <p className="text-white/70">{formatPKR(subtotal)}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium">
          Checkout
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
