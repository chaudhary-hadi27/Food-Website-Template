"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/features/cart/cart-context";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Header({ restaurantName }: { restaurantName: string }) {
  const { itemCount } = useCart();
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/menu", label: t("nav_menu") },
    { href: "/reservations", label: t("nav_reservations") },
    { href: "/track", label: t("nav_my_orders") },
    { href: "/about", label: t("nav_about") },
    { href: "/contact", label: t("nav_contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="font-[var(--font-display)] text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {restaurantName}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            className="hidden h-9 items-center justify-center rounded-full border border-[var(--color-border)] px-3 text-xs font-semibold transition-colors hover:bg-[var(--color-surface)] sm:flex"
            aria-label="Toggle language"
          >
            {lang === "en" ? "اردو" : "English"}
          </button>

          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]"
            aria-label="View cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.847-4.766 2.135-7.363a1.15 1.15 0 00-1.147-1.28H5.622M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[11px] font-semibold text-white animate-fade-up">
                {itemCount}
              </span>
            )}
          </Link>

          <Link href="/menu">
            <span className="hidden rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-dark)] sm:inline-block">
              {t("nav_order_now")}
            </span>
          </Link>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-[var(--color-border)] transition-all duration-300 md:hidden",
          mobileOpen ? "max-h-72" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--color-accent)]"
          >
            {lang === "en" ? "اردو میں دیکھیں" : "View in English"}
          </button>
        </nav>
      </div>
    </header>
  );
}
