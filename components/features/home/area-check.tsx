"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { MapPin } from "@/components/ui/icons";

/** "Apna Area Dalein": customer types their area and instantly sees if we deliver there. */
export function AreaCheck({ areas, whatsapp }: { areas: string[]; whatsapp: string }) {
  const { lang } = useLanguage();
  const ur = lang === "ur";
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const hit = query.length >= 2 ? areas.find((a) => a.toLowerCase().includes(query) || query.includes(a.toLowerCase())) : undefined;

  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
          {ur ? "Kya hum aap ke area me deliver karte hain?" : "Do we deliver to your area?"}
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ur ? "Apna Area Dalein (jaise: Gulberg)" : "Type your area (e.g. Gulberg)"}
          className="mt-3 h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-5 text-center text-base outline-none focus:border-[var(--color-accent)]"
        />
        {query.length >= 2 &&
          (hit ? (
            <p className="mt-3 rounded-xl bg-[var(--color-cta-light)] px-4 py-2 text-sm font-semibold text-[var(--color-cta-dark)]">
              ✓ {ur ? `Ji haan! ${hit} me delivery hoti hai.` : `Yes! We deliver to ${hit}.`}
            </p>
          ) : (
            <p className="mt-3 rounded-xl bg-[#faf3df] px-4 py-2 text-sm text-[var(--color-warning)]">
              {ur ? "Is area ka pata nahi. " : "Not sure about this area. "}
              {whatsapp && (
                <a
                  className="font-semibold underline"
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Kya aap ${q.trim()} me deliver karte hain?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ur ? "WhatsApp par pooch lein" : "Ask on WhatsApp"}
                </a>
              )}
            </p>
          ))}
      </div>
    </section>
  );
}
