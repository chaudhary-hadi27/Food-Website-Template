"use client";

import Link from "next/link";
import { useCart } from "@/components/features/cart/cart-context";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export default function CartPage() {
  const { lines, updateQuantity, removeItem, subtotal } = useCart();
  const { t } = useLanguage();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <p className="text-4xl">🛒</p>
        <h1 className="mt-4 font-[var(--font-display)] text-2xl font-bold">{t("cart_empty")}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link href="/menu">
          <Button className="mt-6">{t("browse_menu")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-[var(--font-display)] text-3xl font-bold">{t("your_cart")}</h1>

      <div className="mt-6 divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-white">
        {lines.map((line) => (
          <div key={line.menu_item_id} className="flex items-center gap-4 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface)]">
              {line.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.image_url} alt={line.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">🍔</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{line.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{formatPKR(line.price_pkr)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(line.menu_item_id, line.quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
              <button
                onClick={() => updateQuantity(line.menu_item_id, line.quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <p className="w-20 text-right text-sm font-semibold">{formatPKR(line.price_pkr * line.quantity)}</p>
            <button
              onClick={() => removeItem(line.menu_item_id)}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
              aria-label="Remove item"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">{t("subtotal")}</p>
          <p className="text-lg font-semibold">{formatPKR(subtotal)}</p>
        </div>
        <Link href="/checkout">
          <Button size="lg">{t("proceed_checkout")}</Button>
        </Link>
      </div>
    </div>
  );
}
