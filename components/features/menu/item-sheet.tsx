"use client";

import { useEffect, useState } from "react";
import { formatPKR, optimizeImageUrl } from "@/lib/utils";
import { Badge, StarRating } from "@/components/ui/misc";
import { useCart } from "@/components/features/cart/cart-context";
import { useLanguage } from "@/lib/i18n";
import { Minus, Plus, X, MessageCircle, UtensilsCrossed } from "@/components/ui/icons";
import type { MenuItem } from "@/types";

/**
 * Full item view: opens when a dish card is tapped. Shows the whole description (cards only
 * show a short preview), a quantity picker and a big green "add" button — bottom sheet on
 * phones, centred dialog on larger screens.
 */
export function ItemSheet({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { addItem } = useCart();
  const { lang } = useLanguage();
  const [qty, setQty] = useState(1);
  const ur = lang === "ur";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function handleAdd() {
    addItem(
      { menu_item_id: item.id, name: item.name, price_pkr: item.price_pkr, image_url: item.image_url },
      qty
    );
    onClose();
  }

  function shareOnWhatsApp() {
    const url = `${window.location.origin}/menu?category=${encodeURIComponent(item.category)}`;
    const text = `${item.name} - ${formatPKR(item.price_pkr)}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <div
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--color-text-primary)] shadow"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative aspect-[16/10] w-full shrink-0 bg-[var(--color-accent-light)]">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={optimizeImageUrl(item.image_url, 900)} alt={item.name} className="h-full w-full object-cover saturate-[1.12] contrast-[1.03] sepia-[.08]" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <UtensilsCrossed className="h-12 w-12 text-[var(--color-accent)]/40" strokeWidth={1.2} />
            </div>
          )}
          {item.is_bestseller === 1 && (
            <Badge variant="gold" className="absolute left-3 top-3 shadow-sm">
              ★ {ur ? "Sab ki pasand" : "Fan Favourite"}
            </Badge>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-[var(--font-display)] text-xl font-bold leading-snug text-[var(--color-text-primary)]">
              {item.name}
            </h2>
            <span className="shrink-0 font-[var(--font-display)] text-xl font-bold text-[var(--color-cta)]">
              {formatPKR(item.price_pkr)}
            </span>
          </div>
          <div className="mt-1">
            <StarRating rating={item.rating} />
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {item.description || (ur ? "Tafseel jald add ki jayegi." : "Details coming soon.")}
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--color-border)] bg-white p-4">
          <div className="flex items-center rounded-full border border-[var(--color-border)]">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease"
              className="flex h-12 w-12 items-center justify-center rounded-full"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-7 text-center text-base font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              aria-label="Increase"
              className="flex h-12 w-12 items-center justify-center rounded-full"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={!item.is_available}
            className="h-12 flex-1 rounded-full bg-[var(--color-cta)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-cta-dark)] active:scale-[0.98] disabled:opacity-40"
          >
            {item.is_available
              ? `${ur ? "Cart mein dalein" : "Add to cart"} · ${formatPKR(item.price_pkr * qty)}`
              : ur ? "Abhi available nahi" : "Unavailable"}
          </button>
          <button
            onClick={shareOnWhatsApp}
            aria-label="Share on WhatsApp"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
