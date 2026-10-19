"use client";

import { useState } from "react";
import { formatPKR, cn, optimizeImageUrl } from "@/lib/utils";
import { Badge, StarRating } from "@/components/ui/misc";
import { useCart } from "@/components/features/cart/cart-context";
import type { MenuItem } from "@/types";
import { FloatCard } from "@/components/ui/float-reveal";
import { Plus, UtensilsCrossed } from "@/components/ui/icons";

/** SVG fallback — elegant gourmet cloche outline */
function ClocheIcon() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--color-accent-light)] gap-1">
      <UtensilsCrossed className="h-8 w-8 text-[var(--color-accent)]/40" strokeWidth={1.2} />
      <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-accent)]/30">
        No image
      </span>
    </div>
  );
}

export function MenuCard({
  item,
  delay = 0,
}: {
  item: MenuItem;
  delay?: number;
}) {
  const { addItem, lastAddedId } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const isBumping = lastAddedId === item.id || justAdded;

  function handleAdd() {
    if (!item.is_available) return;
    addItem(
      {
        menu_item_id: item.id,
        name: item.name,
        price_pkr: item.price_pkr,
        image_url: item.image_url,
      },
      1
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 500);
  }

  return (
    <FloatCard
      delay={delay}
      className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-accent-light)]">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizeImageUrl(item.image_url, 640)}
            alt={item.name}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ClocheIcon />
        )}

        {/* Badges */}
        {item.is_bestseller === 1 && (
          <Badge
            variant="gold"
            className="absolute left-3 top-3 shadow-sm"
          >
            ★ Fan Favourite
          </Badge>
        )}
        {!item.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <Badge variant="error">Unavailable</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <h3 className="min-w-0 truncate font-[var(--font-display)] text-xs sm:text-sm font-semibold leading-snug text-[var(--color-text-primary)]">
            {item.name}
          </h3>
          <div className="scale-90 origin-left sm:scale-100">
            <StarRating rating={item.rating} />
          </div>
        </div>
        <p className="mt-1 line-clamp-1 text-[10px] sm:text-xs leading-relaxed text-[var(--color-text-secondary)] sm:line-clamp-2">
          {item.description}
        </p>

        <div className="mt-3 flex items-center justify-between sm:mt-4">
          <span className="font-[var(--font-display)] text-xs sm:text-base font-bold text-[var(--color-text-primary)]">
            {formatPKR(item.price_pkr)}
          </span>
          <button
            onClick={handleAdd}
            disabled={!item.is_available}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white shadow-sm transition-all duration-200 hover:bg-[var(--color-accent-dark)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9 sm:rounded-xl",
              isBumping && "scale-110"
            )}
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </FloatCard>
  );
}
