"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPKR } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS } from "@/lib/constants";
import { Badge } from "@/components/ui/misc";
import type { Order } from "@/types";

function useCountdown(createdAt: string, estimatedMinutes: number) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function tick() {
      const target = new Date(createdAt).getTime() + estimatedMinutes * 60_000;
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining("Arriving any moment");
        return;
      }
      const mins = Math.floor(diff / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      setRemaining(`${mins}m ${secs.toString().padStart(2, "0")}s`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt, estimatedMinutes]);

  return remaining;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch(`/api/orders/${params.id}`);
      if (!active) return;
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [params.id]);

  const countdown = useCountdown(order?.created_at ?? new Date().toISOString(), order?.estimated_delivery_minutes ?? 45 as number);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-[var(--color-text-secondary)]">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">We couldn&apos;t find that order.</p>
        <Link href="/menu" className="mt-4 inline-block text-sm font-medium text-[var(--color-accent)]">Back to menu →</Link>
      </div>
    );
  }

  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(order.status as typeof ORDER_STATUS_STEPS[number]);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="mt-3 font-[var(--font-display)] text-2xl font-bold">Order Confirmed!</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Reference: {order.reference}</p>
      </div>

      {!isCancelled && (
        <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-light)] p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-accent-dark)]">
            Estimated arrival
          </p>
          <p className="mt-1 font-[var(--font-display)] text-3xl font-bold text-[var(--color-accent-dark)]">
            {countdown}
          </p>
        </div>
      )}

      {isCancelled && (
        <div className="mt-8 rounded-2xl border border-[var(--color-error)] bg-[#fbe9e9] p-6 text-center">
          <p className="text-sm font-medium text-[var(--color-error)]">This order was cancelled.</p>
        </div>
      )}

      {!isCancelled && (
        <div className="mt-8 flex items-center justify-between">
          {ORDER_STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i <= currentStepIndex ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)]"
                }`}
              >
                {i < currentStepIndex ? "✓" : i + 1}
              </div>
              <p className="text-center text-[11px] text-[var(--color-text-secondary)]">{ORDER_STATUS_LABELS[step]}</p>
              {i < ORDER_STATUS_STEPS.length - 1 && (
                <div className={`absolute mt-4 h-0.5 w-full ${i < currentStepIndex ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-sm font-semibold">Order Details</h2>
        <div className="mt-3 space-y-2 text-sm">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-[var(--color-text-secondary)]">
              <span>{item.quantity} × {item.name}</span>
              <span>{formatPKR(item.price_pkr * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-[var(--color-border)] pt-3 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPKR(order.total_pkr)}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <span>Delivering to: {order.customer_address}</span>
          <Badge variant="neutral">{order.payment_method.replace("_", " ")}</Badge>
        </div>
      </div>

      <Link href="/menu" className="mt-6 block text-center text-sm font-medium text-[var(--color-accent)]">
        ← Order something else
      </Link>
    </div>
  );
}
