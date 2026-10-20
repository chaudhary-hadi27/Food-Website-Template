import Link from "next/link";
import type { SiteSettings } from "@/types";
import { Phone, MapPin, Flame } from "@/components/ui/icons";

export function Footer({ settings }: { settings: SiteSettings }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-accent)] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:gap-12 sm:px-6 sm:py-16 md:grid-cols-3">
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Flame className="h-4.5 w-4.5 text-white" />
            </div>
            <h3 className="font-[var(--font-display)] text-lg font-bold">
              {settings.restaurant_name}
            </h3>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/90">
            Gourmet burgers and comfort food, made fresh, delivered fast.
          </p>
          <a
            href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--color-accent)] shadow-md transition-all hover:bg-white/90 hover:scale-[1.03] active:scale-95"
          >
            Order on WhatsApp →
          </a>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/60">Navigate</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { href: "/menu",    label: "Menu" },
              { href: "/contact", label: "Contact" },
              { href: "/track",   label: "Track Order" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-block py-2.5 text-white/85 transition-colors hover:text-white font-medium">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white/60">Get in Touch</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/85">
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
              {settings.phone}
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
              {settings.address}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15 px-4 py-5 text-center text-xs text-white/50 sm:px-6">
        © {currentYear} {settings.restaurant_name}. All rights reserved.
      </div>
    </footer>
  );
}
