import { getSiteSettings } from "@/lib/get-settings";
import { Reveal } from "@/components/ui/reveal";
import { T } from "@/components/ui/translated-text";
import type { Metadata } from "next";
import { Phone, MessageCircle, MapPin, Clock, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — Flaming Bites",
  description: "Call, WhatsApp, or visit us — we'd love to hear from you.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const waLink = `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`;

  return (
    <>
      {/* ═══════════════════════════════ HERO STRIP ═══════════════════════════════ */}
      <section className="relative overflow-hidden bg-[var(--color-accent)] py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
              <T k="lets_connect" />
            </p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              <T k="get_in_touch" />
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              <T k="contact_subtitle" />
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════ CONTACT CARDS ═══════════════════════════════ */}
      <section className="relative -mt-16 bg-[var(--color-background)] pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Call Card */}
            <Reveal delay={0}>
              <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-[var(--color-accent-light)] transition-all group-hover:scale-150 group-hover:bg-[var(--color-accent)]/10" />
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/25">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-6 font-[var(--font-display)] text-xl font-bold text-[var(--color-text-primary)]">
                    <T k="call_us" />
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    <T k="direct_line_answers" />
                  </p>
                  <a
                    href={`tel:${settings.phone}`}
                    className="mt-4 inline-flex items-center gap-2 text-2xl font-bold text-[var(--color-accent)] transition-all hover:gap-3"
                  >
                    {settings.phone}
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </Reveal>

            {/* WhatsApp Card */}
            <Reveal delay={150}>
              <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-[var(--color-success-light)] transition-all group-hover:scale-150" />
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] shadow-lg shadow-[#25D366]/25">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-6 font-[var(--font-display)] text-xl font-bold text-[var(--color-text-primary)]">
                    WhatsApp
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    <T k="quick_chat_whatsapp" />
                  </p>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-2xl font-bold text-[#25D366] transition-all hover:gap-3"
                  >
                    <T k="chat_now" />
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </Reveal>

            {/* Visit Card */}
            <Reveal delay={300}>
              <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-[var(--color-accent-light)] transition-all group-hover:scale-150 group-hover:bg-[var(--color-accent)]/10" />
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-text-primary)] shadow-lg shadow-gray-900/25">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-6 font-[var(--font-display)] text-xl font-bold text-[var(--color-text-primary)]">
                    <T k="visit_us" />
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    <T k="come_say_hello" />
                  </p>
                  <p className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                    {settings.address}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* ═══════════════════════════════ TIMING & EXTRA INFO ═══════════════════════════════ */}
          <Reveal delay={400}>
            <div className="mt-10 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white p-8 sm:p-10">
              <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-light)]">
                    <Clock className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      <T k="working_hours" />
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      <T k="working_hours_desc" />
                    </p>
                  </div>
                </div>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1ebe57] hover:shadow-lg"
                >
                  <MessageCircle className="h-4 w-4" />
                  <T k="order_via_whatsapp" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}