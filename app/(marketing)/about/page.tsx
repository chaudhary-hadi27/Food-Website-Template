import { getSiteSettings } from "@/lib/get-settings";
import { Reveal } from "@/components/ui/reveal";
import { T } from "@/components/ui/translated-text";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Flaming Bites",
  description: "Fresh ingredients, made-to-order gourmet burgers, and fast delivery across the city.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Reveal>
        <h1 className="font-[var(--font-display)] text-4xl font-bold"><T k="our_story" /></h1>
        <p className="mt-4 text-[var(--color-text-secondary)]">
          {settings.restaurant_name} started with a simple idea: comfort food doesn&apos;t have to compromise on
          quality. Every burger is made to order with fresh ingredients, and every dish is plated with the same care
          you&apos;d expect from a fine-dining kitchen.
        </p>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-10 aspect-video overflow-hidden rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"
            alt="Restaurant interior"
            className="h-full w-full object-cover"
          />
        </div>
      </Reveal>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {[
          { title: "Fresh Ingredients", text: "Sourced daily from trusted local suppliers." },
          { title: "Made to Order", text: "Every dish prepared fresh after you order, not before." },
          { title: "Fast, Reliable Delivery", text: "Average delivery time of 30 minutes across the city." },
        ].map((item, i) => (
          <Reveal key={item.title} delay={i * 100}>
            <div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
