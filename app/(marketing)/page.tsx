import Link from "next/link";
import { getSiteSettings } from "@/lib/get-settings";
import { getCachedMenu } from "@/lib/menu-cache";
import { getDeliveredOrderCount } from "@/lib/public-stats";
import { MenuCard } from "@/components/features/menu/menu-card";
import { Badge } from "@/components/ui/misc";
import { T } from "@/components/ui/translated-text";
import { FloatReveal, FloatHero, FloatImage } from "@/components/ui/float-reveal";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import Image from "next/image";
import {
  Truck, Star, Clock, ArrowRight, Flame, Leaf, Coffee, IceCream2, UtensilsCrossed, Sandwich, Pizza, Wine, Salad
} from "@/components/ui/icons";

// Rendered once and reused for 60s (instead of on every visit); admin edits to the menu or
// settings refresh it immediately through revalidateTag.
export const revalidate = 60;

const DEFAULT_CATEGORIES = ["Gourmet Burgers", "Premium Sides", "Artisan Drinks", "Desserts"];

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  "Gourmet Burgers": <Sandwich className="h-5 w-5" strokeWidth={1.5} />,
  "Premium Sides": <Salad className="h-5 w-5" strokeWidth={1.5} />,
  "Artisan Drinks": <Coffee className="h-5 w-5" strokeWidth={1.5} />,
  "Desserts": <IceCream2 className="h-5 w-5" strokeWidth={1.5} />,
};

function getCategoryIcon(cat: string) {
  return CATEGORY_ICON_MAP[cat] ?? <UtensilsCrossed className="h-5 w-5" strokeWidth={1.5} />;
}

interface HomepageSection {
  id: string;
  category: string;
  limit: number;
  show: boolean;
  productIds?: number[];
}

interface HomepageReview {
  name: string;
  text: string;
  item?: string;
}

export default async function HomePage() {
  const settings = await getSiteSettings();

  // Parse dynamic categories
  let categories: string[] = DEFAULT_CATEGORIES;
  try {
    const raw = settings.categories;
    if (raw) categories = JSON.parse(raw);
  } catch { /* use defaults */ }

  // Parse homepage layout config
  let homepageLayout: HomepageSection[] = categories.map((cat, i) => ({
    id: `default-${i}`,
    category: cat,
    limit: 4,
    show: true,
  }));
  try {
    const rawLayout = settings.homepage_layout;
    if (rawLayout) homepageLayout = JSON.parse(rawLayout);
  } catch { /* use defaults */ }

  const visibleSections = homepageLayout.filter((s) => s.show);

  // Reviews are REAL ones typed in by the restaurant (Admin → Settings). None set = the
  // whole section stays hidden; nothing invented is ever shown to customers.
  let reviews: HomepageReview[] = [];
  try {
    const parsed = settings.homepage_reviews ? JSON.parse(settings.homepage_reviews) : [];
    if (Array.isArray(parsed)) {
      reviews = parsed
        .filter((r) => r && typeof r.name === "string" && typeof r.text === "string" && r.name.trim() && r.text.trim())
        .slice(0, 6);
    }
  } catch { /* ignore malformed JSON */ }

  // Stats: only true numbers. "Orders delivered" is counted from the database and only
  // appears once there are at least 50; the delivery time is the restaurant's own setting.
  const deliveredCount = await getDeliveredOrderCount();
  const stats: { value: number; suffix: string; labelKey: "orders_delivered" | "avg_delivery"; Icon: typeof Star }[] = [];
  if (deliveredCount >= 50) {
    stats.push({ value: Math.floor(deliveredCount / 10) * 10, suffix: "+", labelKey: "orders_delivered", Icon: Star });
  }
  stats.push({ value: settings.default_delivery_minutes, suffix: " min", labelKey: "avg_delivery", Icon: Clock });

  // One shared, cached read of the menu; each section is picked out of it in memory.
  const allItems = await getCachedMenu();
  const sectionItems = visibleSections.map((section) => {
    let items: typeof allItems;
    if (section.productIds !== undefined) {
      // Admin has explicitly chosen items (or deselected all), shown in the chosen order.
      const order = section.productIds;
      items = allItems
        .filter((i) => order.includes(i.id))
        .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
        .slice(0, section.limit);
    } else {
      items = allItems
        .filter((i) => i.category === section.category)
        .sort((a, b) => b.is_bestseller - a.is_bestseller || b.rating - a.rating)
        .slice(0, section.limit);
    }
    return { section, items };
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* ═══════════════════════════════════════════════════════════ HERO */}
      <section className="relative overflow-hidden bg-white h-[50vh] sm:h-[70vh] lg:h-[88vh] w-full">
        {/* Responsive Hero Banner using public/uploads */}
        <picture className="absolute inset-0 h-full w-full">
          <source media="(max-width: 640px)" srcSet="/uploads/hero-mobile.webp" type="image/webp" />
          <img
            src="/uploads/hero-desktop.webp"
            alt={settings.restaurant_name}
            fetchPriority="high"
            decoding="async"
            width={1376}
            height={768}
            className="h-full w-full object-cover brightness-[0.65] transition-transform duration-[12s] scale-105 hover:scale-100"
          />
        </picture>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-center px-4">
          <FloatHero delay={0}>
            <h1 className="font-[var(--font-display)] text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-md">
              {settings.restaurant_name}
            </h1>
          </FloatHero>
          <FloatHero delay={150}>
            <p className="mt-4 max-w-xl text-xs sm:text-base font-semibold uppercase tracking-widest text-white/90 drop-shadow">
              {settings.address}
            </p>
          </FloatHero>
          <FloatHero delay={300}>
            <div className="mt-8 flex gap-3">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--color-accent-dark)] hover:scale-105 active:scale-95"
              >
                <T k="hero_order_now" />
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FloatHero>
        </div>

        {/* ── Stats Strip (real numbers only) ───────────────────────── */}
        <div
          className="border-t border-[var(--color-border)]"
          style={{ background: "linear-gradient(to right, #f8f9fa, #ffffff, #f8f9fa)" }}
        >
          <div
            className="mx-auto grid max-w-4xl divide-x divide-[var(--color-border)] px-4 sm:px-6"
            style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
          >
            {stats.map(({ value, suffix, labelKey, Icon }) => (
              <div key={labelKey} className="flex flex-col items-center py-6 text-center sm:py-8">
                <Icon className="mb-2 h-4 w-4 text-[var(--color-accent)]" strokeWidth={1.5} />
                <p className="font-[var(--font-display)] text-xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
                  <AnimatedCounter value={value} suffix={suffix} />
                </p>
                <p className="mt-1 text-[10px] font-medium text-[var(--color-text-tertiary)] sm:text-xs">
                  <T k={labelKey} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ CATEGORIES */}
      <section className="relative overflow-hidden bg-[var(--color-background)] py-16 sm:py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-accent-light)_0%,_transparent_60%)] opacity-40" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <FloatReveal>
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)]">
                <T k="browse_by_category" />
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
                <T k="explore_menu" />
              </h2>
            </div>
          </FloatReveal>

          {/* Scrolling categories - Horizontal scroll on mobile, flex wrap on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-4 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
            {categories.map((cat, i) => (
              <FloatReveal key={cat} delay={i * 70}>
                <Link
                  href={`/menu?category=${encodeURIComponent(cat)}`}
                  className="group relative flex shrink-0 items-center gap-3 rounded-full border border-[var(--color-border)] bg-white/60 px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white hover:shadow-lg sm:px-6 sm:py-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center transition-transform group-hover:scale-110">
                    {getCategoryIcon(cat)}
                  </span>
                  <span className="whitespace-nowrap">{cat}</span>
                </Link>
              </FloatReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ DYNAMIC PRODUCT SECTIONS */}
      {sectionItems.map(({ section, items }, sIdx) => {
        if (!items.length) return null;
        const bgAlt = sIdx % 2 === 1;
        return (
          <section
            key={section.id}
            className="py-20"
            style={{ background: bgAlt ? "white" : "var(--color-background)" }}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <FloatReveal>
                <div className="mb-10 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)]">
                      {section.category}
                    </p>
                    <h2 className="mt-2 font-[var(--font-display)] text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
                      {sIdx === 0 ? <T k="customer_favorites" /> : section.category}
                    </h2>
                  </div>
                  <Link
                    href={`/menu?category=${encodeURIComponent(section.category)}`}
                    className="hidden items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] hover:underline sm:flex"
                  >
                    <T k="view_full_menu" />
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </FloatReveal>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
                {items.map((item, i) => (
                  <MenuCard key={item.id} item={item} delay={i * 80} />
                ))}
              </div>

              <div className="mt-8 text-center sm:hidden">
                <Link
                  href={`/menu?category=${encodeURIComponent(section.category)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)]"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      {/* ═══════════════════════════════════════════════ BRAND STRIP */}
      <section
        className="py-24"
        style={{
          background: "var(--color-accent)",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <FloatReveal>
            <Flame className="mx-auto mb-6 h-10 w-10 text-white/30" strokeWidth={1} />
            <blockquote className="font-[var(--font-display)] text-3xl font-bold italic leading-tight text-white sm:text-4xl lg:text-5xl">
              &ldquo;<T k="every_bite_memory" />&rdquo;
            </blockquote>
            <p className="mt-6 text-sm font-medium uppercase tracking-widest text-white/50">
              {settings.restaurant_name} · {settings.address}
            </p>
          </FloatReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ REVIEWS (real, optional) */}
      {reviews.length > 0 && (
        <section className="bg-[var(--color-background)] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <FloatReveal>
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)]">
                  <T k="customer_love" />
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold sm:text-3xl">
                  <T k="what_locals_say" />
                </h2>
              </div>
            </FloatReveal>

            {/* Mobile: horizontal scroll | Desktop: grid */}
            <div className="-mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-6 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
              <div className="flex gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review, i) => (
                  <FloatReveal key={i} delay={i * 80}>
                    <div className="group flex w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all hover:border-[var(--color-accent)]/30 hover:shadow-lg sm:w-full sm:p-6">
                      {review.item && (
                        <span className="self-start rounded-full bg-[var(--color-accent-light)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
                          {review.item}
                        </span>
                      )}
                      <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        &ldquo;{review.text}&rdquo;
                      </p>
                      <div className="mt-auto flex items-center gap-3 border-t border-[var(--color-border)] pt-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white shadow-sm">
                          {review.name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{review.name}</p>
                      </div>
                    </div>
                  </FloatReveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════ FOOTER CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <FloatReveal>
            <h2 className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
              <T k="hungry_order_in_minutes" />
            </h2>
            <p className="mt-4 text-[var(--color-text-secondary)]">
              <T k="payment_methods_sub" />
            </p>
            <Link
              href="/menu"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-8 py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--color-accent-dark)] hover:shadow-xl hover:-translate-y-1"
            >
              <T k="start_your_order" />
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FloatReveal>
        </div>
      </section>
    </div>
  );
}
