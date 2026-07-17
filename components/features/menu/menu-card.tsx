"use client";

import { useState } from "react";
import { formatPKR, cn } from "@/lib/utils";
import { Badge, StarRating } from "@/components/ui/misc";
import { useCart } from "@/components/features/cart/cart-context";
import type { MenuItem } from "@/types";

export function MenuCard({ item }: { item: MenuItem }) {
  const { addItem, lastAddedId } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const isBumping = lastAddedId === item.id || justAdded;

  function handleAdd() {
    if (!item.is_available) return;
    addItem(
      { menu_item_id: item.id, name: item.name, price_pkr: item.price_pkr, image_url: item.image_url },
      1
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 500);
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface)]">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-tertiary)]">
            <span className="text-3xl">🍔</span>
          </div>
        )}
        {item.is_bestseller === 1 && (
          <Badge variant="gold" className="absolute left-3 top-3">★ Bestseller</Badge>
        )}
        {!item.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Badge variant="error">Currently unavailable</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{item.name}</h3>
          <StarRating rating={item.rating} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{item.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatPKR(item.price_pkr)}</span>
          <button
            onClick={handleAdd}
            disabled={!item.is_available}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition-all duration-200 hover:bg-[var(--color-accent-dark)] disabled:cursor-not-allowed disabled:opacity-40",
              isBumping && "scale-125"
            )}
            aria-label={`Add ${item.name} to cart`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
