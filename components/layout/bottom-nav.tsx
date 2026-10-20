"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/features/cart/cart-context";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Home, UtensilsCrossed, ClipboardList, Phone, ShoppingCart } from "@/components/ui/icons";

/** Phone-style bottom navigation: big thumb-sized targets, hidden on tablets/desktops. */
export function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { t } = useLanguage();

  const links = [
    { href: "/", label: t("nav_home"), Icon: Home },
    { href: "/menu", label: t("nav_menu"), Icon: UtensilsCrossed },
    { href: "/cart", label: t("nav_cart"), Icon: ShoppingCart, badge: itemCount },
    { href: "/track", label: t("nav_my_orders"), Icon: ClipboardList },
    { href: "/contact", label: t("nav_contact"), Icon: Phone },
  ];

  // Checkout / order pages keep the screen free for the form.
  if (pathname.startsWith("/checkout")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {links.map(({ href, label, Icon, badge }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.7} />
                  {!!badge && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-cta)] px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate px-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
