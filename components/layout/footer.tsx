import Link from "next/link";
import type { SiteSettings } from "@/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <h3 className="font-[var(--font-display)] text-lg font-bold">{settings.restaurant_name}</h3>
          <p className="mt-3 max-w-xs text-sm text-[var(--color-text-secondary)]">
            Gourmet burgers and comfort food, made fresh, delivered fast.
          </p>
          <a
            href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-success)]"
          >
            Order on WhatsApp →
          </a>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li><Link href="/menu" className="hover:text-[var(--color-accent)]">Menu</Link></li>
            <li><Link href="/reservations" className="hover:text-[var(--color-accent)]">Book a Table</Link></li>
            <li><Link href="/about" className="hover:text-[var(--color-accent)]">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-[var(--color-accent)]">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Get in Touch</h4>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>{settings.phone}</li>
            <li>{settings.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] px-4 py-5 text-center text-xs text-[var(--color-text-tertiary)] sm:px-6">
        © {new Date().getFullYear()} {settings.restaurant_name}. All rights reserved.
      </div>
    </footer>
  );
}
