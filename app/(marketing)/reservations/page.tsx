"use client";

import { useState } from "react";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { useLanguage } from "@/lib/i18n";

export default function ReservationsPage() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          party_size: partySize,
          reservation_date: date,
          reservation_time: time,
          special_requests: notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setConfirmation(data.reservation.reference);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <p className="text-4xl">✅</p>
        <h1 className="mt-4 font-[var(--font-display)] text-2xl font-bold">Reservation Requested</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Reference: <span className="font-semibold">{confirmation}</span>
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          We&apos;ll confirm your table by phone shortly. Save this reference for your records.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Reveal>
        <h1 className="font-[var(--font-display)] text-3xl font-bold">{t("book_a_table")}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Reserve your table in seconds — no phone call needed.
        </p>
      </Reveal>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <Input label={t("full_name")} required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t("phone_number")} required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XXXXXXXXX" />

        <div className="grid grid-cols-2 gap-4">
          <Input label={t("date")} type="date" required min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label={t("time")} type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <Select label={t("number_of_guests")} value={partySize} onChange={(e) => setPartySize(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "guest" : "guests"}
            </option>
          ))}
        </Select>

        <Textarea
          label="Special Requests (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Birthday celebration, window seat, allergies, etc."
        />

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {t("request_reservation")}
        </Button>
      </form>
    </div>
  );
}
