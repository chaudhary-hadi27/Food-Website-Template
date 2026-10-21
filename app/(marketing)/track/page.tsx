"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPKR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/misc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PublicOrder } from "@/types";
import { Section, PageHeader, EmptyState } from "@/components/ui/layout-primitives";

export default function TrackOrdersPage() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<PublicOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders/by-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, phone: query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setOrders(null);
        return;
      }
      setOrders(data.orders);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section width="narrow" padY="default">
      <PageHeader
        title="My Orders"
        subtitle="Enter your phone number (e.g. 0300..., +92...) or your Order ID (e.g. K7Q2X9) to track your delivery."
      />

      <form onSubmit={handleLookup} className="mt-6 flex gap-2">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Phone number (0300... / +92...) or Order ID (K7Q2X9)"
            required
          />
        </div>
        <Button type="submit" loading={loading}>Track Order</Button>
      </form>
      {error && <p className="mt-2 text-sm text-[var(--color-error)]">{error}</p>}

      {orders !== null && (
        <div className="mt-8">
          {orders.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No orders found"
              description="We couldn't find any orders matching this Phone Number or Order ID."
            />
          ) : (
            <div className="mt-6 space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.reference}
                  href={`/order/${order.reference}`}
                  className="block rounded-2xl border border-[var(--color-border)] bg-white p-4 transition-colors hover:border-[var(--color-accent)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{order.reference}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {new Date(order.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatPKR(order.total_pkr)}</p>
                      <Badge variant="neutral">{ORDER_STATUS_LABELS[order.status]}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
