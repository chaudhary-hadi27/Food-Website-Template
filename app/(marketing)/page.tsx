import Link from "next/link";
import { db } from "@/lib/db";
import { menuItems } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSiteSettings } from "@/lib/get-settings";
import { CATEGORIES } from "@/lib/constants";
import { MenuCard } from "@/components/features/menu/menu-card";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/misc";
import { serializeMenuItem } from "@/lib/serializers";
import { T } from "@/components/ui/translated-text";
import { Parallax } from "@/components/ui/parallax";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, string> = {
  "Gourmet Burgers": "🍔",
  "Premium Sides": "🍟",
  "Artisan Drinks": "🥤",
  Desserts: "🍰",
};

export default async function HomePage() {
  const settings = await getSiteSettings();
  const bestsellers = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.isBestseller, 1))
    .orderBy(desc(menuItems.rating))
    .limit(4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="animate-fade-up">
            <Badge variant="accent">⭐ 4.8 rated · 30 min delivery</Badge>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-5xl md:text-6xl">
              {settings.hero_headline}
            </h1>
            <p className="mt-5 max-w-md text-base text-[var(--color-text-secondary)]">
              {settings.hero_subheadline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="rounded-full bg-[var(--color-accent)] px-7 py-3.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent-dark)] hover:scale-[1.03] active:scale-[0.98]"
              >
                <T k="hero_order_now" />
              </Link>
              <Link
                href="/reservations"
                className="rounded-full border border-[var(--color-border)] px-7 py-3.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-white"
              >
                <T k="hero_book_table" />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-[var(--color-text-secondary)]">
              <span>🚚 30 min average delivery</span>
              <span>💳 COD · JazzCash · EasyPaisa</span>
              <span>📍 {settings.address}</span>
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl shadow-2xl">
            <Parallax strength={0.08}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1000&q=80"
                alt="Signature burger"
                className="h-full w-full object-cover scale-110"
              />
            </Parallax>
          </div>
        </div>
      </section>

      {/* Animated trust stats */}
      <section className="border-y border-[var(--color-border)] bg-white py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6 px-4 text-center sm:px-6">
          <div>
            <p className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-accent)] sm:text-4xl">
              <AnimatedCounter value={2400} suffix="+" />
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">Happy Customers</p>
          </div>
          <div>
            <p className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-accent)] sm:text-4xl">
              4.8<span className="text-xl">/5.0</span>
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">Average Rating</p>
          </div>
          <div>
            <p className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-accent)] sm:text-4xl">
              <AnimatedCounter value={30} suffix=" min" />
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">Average Delivery</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <h2 className="text-center font-[var(--font-display)] text-2xl font-bold sm:text-3xl"><T k="explore_menu" /></h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat} delay={i * 80}>
              <Link
                href={`/menu?category=${encodeURIComponent(cat)}`}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-md"
              >
                <span className="text-3xl">{CATEGORY_ICONS[cat]}</span>
                <span className="text-sm font-medium">{cat}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured / Bestsellers */}
      <section className="bg-[var(--color-surface)] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="font-[var(--font-display)] text-2xl font-bold sm:text-3xl"><T k="customer_favorites" /></h2>
              <Link href="/menu" className="text-sm font-medium text-[var(--color-accent)] hover:underline">
                <T k="view_full_menu" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellers.map((item, i) => (
              <Reveal key={item.id} delay={i * 100}>
                <MenuCard item={serializeMenuItem(item)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <h2 className="text-center font-[var(--font-display)] text-2xl font-bold sm:text-3xl">
            <T k="loved_by_regulars" />
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            { name: "Ayesha K.", text: "The Wagyu cheeseburger is worth every rupee. Delivery was quick and hot." },
            { name: "Bilal R.", text: "Booked a table for my anniversary through the site — smooth and confirmed instantly." },
            { name: "Sana M.", text: "Best truffle fries in the city. Ordering again this weekend." },
          ].map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
                <p className="text-sm text-[var(--color-text-secondary)]">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold">{t.name}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
