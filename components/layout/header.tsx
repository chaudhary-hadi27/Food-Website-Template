"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/components/features/cart/cart-context";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ShoppingCart, AlignJustify, X, Flame } from "@/components/ui/icons";

export function Header({ restaurantName }: { restaurantName: string }) {
  const { itemCount } = useCart();
  const { lang, setLang } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/track", label: "My Orders" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header
      className={cn(
        "sticky z-40 transition-all duration-300 ease-out",
        scrolled
          ? "top-3 mx-3 rounded-2xl border border-[var(--color-border)] bg-white/90 shadow-md backdrop-blur-lg lg:top-6 lg:mx-auto lg:max-w-7xl"
          : "top-0 border-b border-[var(--color-border)] bg-white/85 backdrop-blur-lg"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 lg:gap-10 lg:px-8 lg:py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-[var(--font-display)] text-base font-bold tracking-tight text-[var(--color-text-primary)] transition-opacity hover:opacity-80 sm:text-xl"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="truncate">{restaurantName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex lg:gap-12">
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

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            className="hidden h-8 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:flex"
            aria-label="Toggle language"
          >
            {lang === "en" ? "Roman Urdu" : "English"}
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            aria-label="View cart"
          >
            <ShoppingCart className="h-4.5 w-4.5" strokeWidth={1.8} />
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Order CTA */}
          <Link
            href="/menu"
            className="hidden rounded-xl bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-dark)] hover:shadow-md sm:block"
          >
            Order Now
          </Link>

          {/* Mobile hamburger */}
          <button
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <AlignJustify className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-[var(--color-border)] transition-all duration-300 md:hidden",
          mobileOpen ? "max-h-80" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-0.5 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)]"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            className="mt-1 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--color-accent)]"
          >
            {lang === "en" ? "Roman Urdu mein dekhein" : "View in English"}
          </button>
          <Link
            href="/menu"
            onClick={() => setMobileOpen(false)}
            className="mt-2 rounded-xl bg-[var(--color-accent)] py-2.5 text-center text-sm font-semibold text-white"
          >
            Order Now
          </Link>
        </nav>
      </div>
    </header>
  );
}