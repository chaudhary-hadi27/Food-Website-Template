"use client";

import Link from "next/link";
import { useCart } from "@/components/features/cart/cart-context";
import { useCartSync } from "@/components/features/cart/use-cart-sync";
import { useStore } from "@/components/features/store/store-context";
import { Button } from "@/components/ui/button";
import { formatPKR, optimizeImageUrl } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { Section, PageHeader, EmptyState } from "@/components/ui/layout-primitives";

export default function CartPage() {
  const { lines, updateQuantity, removeItem, subtotal } = useCart();
  const { t } = useLanguage();
  const { notices, dismiss } = useCartSync();
  const store = useStore();

  if (lines.length === 0) {
    return (
      <Section width="narrow" padY="lg">
        <EmptyState
          icon="🛒"
          title={t("cart_empty")}
          description={t("cart_empty_desc")}
          action={
            <Link href="/menu">
              <Button>{t("browse_menu")}</Button>
            </Link>
          }
        />
      </Section>
    );
  }

  return (
    <Section width="default" padY="default">
      <PageHeader title={t("your_cart")} />
      {notices.length > 0 && (
        <div role="status" className="mt-4 space-y-1 rounded-xl border border-[var(--color-warning)]/40 bg-[#faf3df] p-4 text-sm text-[var(--color-warning)]">
          {notices.map((n) => (
            <p key={n}>⚠ {n}</p>
          ))}
          <button type="button" onClick={dismiss} className="mt-1 text-xs font-semibold underline">OK</button>
        </div>
      )}

      <div className="mt-6 divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-white">
      {lines.map((line) => (
          <div key={line.menu_item_id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface)] sm:h-16 sm:w-16">
              {line.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={optimizeImageUrl(line.image_url, 160)} alt={line.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">🍔</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{line.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{formatPKR(line.price_pkr)} {t("each")}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => updateQuantity(line.menu_item_id, line.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)] sm:h-8 sm:w-8"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-medium sm:w-6">{line.quantity}</span>
              <button
                onClick={() => updateQuantity(line.menu_item_id, line.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)] sm:h-8 sm:w-8"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <p className="w-16 shrink-0 text-right text-sm font-semibold sm:w-20">{formatPKR(line.price_pkr * line.quantity)}</p>
            <button
              onClick={() => removeItem(line.menu_item_id)}
              className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
              aria-label="Remove item"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">{t("subtotal")}</p>
          <p className="text-lg font-semibold">{formatPKR(subtotal)}</p>
        </div>
        {store.minOrderPkr > 0 && subtotal < store.minOrderPkr ? (
          <p className="text-sm font-semibold text-[var(--color-error)]">
            Kam az kam order {formatPKR(store.minOrderPkr)} ka hona chahiye — {formatPKR(store.minOrderPkr - subtotal)} aur add karein.
          </p>
        ) : (
          <Link href="/checkout" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">{t("proceed_checkout")}</Button>
          </Link>
        )}
      </div>
    </Section>
  );
}
