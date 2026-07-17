"use client";

import { useEffect, useState, useCallback } from "react";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/misc";
import type { Reservation, ReservationStatus } from "@/types";

const STATUS_OPTIONS: ReservationStatus[] = ["pending", "confirmed", "declined", "completed"];

const STATUS_BADGE_VARIANT: Record<string, "neutral" | "accent" | "gold" | "success" | "warning" | "error"> = {
  pending: "warning",
  confirmed: "success",
  declined: "error",
  completed: "neutral",
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/reservations");
    if (res.ok) {
      const data = await res.json();
      setReservations(data.reservations ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateStatus(id: number, status: ReservationStatus) {
    setSavingId(id);
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setReservations((prev) => prev.map((r) => (r.id === id ? data.reservation : r)));
    }
    setSavingId(null);
  }

  return (
    <div>
      <h1 className="font-[var(--font-display)] text-2xl font-bold">Reservations</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Confirm or decline table bookings.</p>

      {loading ? (
        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">Loading reservations...</p>
      ) : reservations.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">No reservations yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <div>
                <p className="text-sm font-semibold">{r.reference}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {r.customer_name} · {r.customer_phone} · {r.party_size} guests
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {r.reservation_date} at {r.reservation_time}
                </p>
                {r.special_requests && (
                  <p className="mt-1 text-xs italic text-[var(--color-text-tertiary)]">&ldquo;{r.special_requests}&rdquo;</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_BADGE_VARIANT[r.status]}>{RESERVATION_STATUS_LABELS[r.status]}</Badge>
                <select
                  value={r.status}
                  disabled={savingId === r.id}
                  onChange={(e) => updateStatus(r.id, e.target.value as ReservationStatus)}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {RESERVATION_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
