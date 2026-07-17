import { getSiteSettings } from "@/lib/get-settings";
import { Reveal } from "@/components/ui/reveal";
import { T } from "@/components/ui/translated-text";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Flaming Bites",
  description: "Call, WhatsApp, or visit us — we'd love to hear from you.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const waLink = `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Reveal>
        <h1 className="font-[var(--font-display)] text-4xl font-bold"><T k="get_in_touch" /></h1>
        <p className="mt-3 text-[var(--color-text-secondary)]">
          Questions, feedback, or bulk orders — we&apos;d love to hear from you.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <Reveal delay={0}>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <p className="text-2xl">📞</p>
            <p className="mt-2 text-sm font-semibold"><T k="call_us" /></p>
            <a href={`tel:${settings.phone}`} className="mt-1 block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
              {settings.phone}
            </a>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <p className="text-2xl">💬</p>
            <p className="mt-2 text-sm font-semibold">WhatsApp</p>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-[var(--color-success)] hover:underline">
              Chat with us
            </a>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <p className="text-2xl">📍</p>
            <p className="mt-2 text-sm font-semibold"><T k="visit_us" /></p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{settings.address}</p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
