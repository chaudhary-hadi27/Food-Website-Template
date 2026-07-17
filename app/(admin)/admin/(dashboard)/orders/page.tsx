"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPKR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/misc";
import type { Order, OrderStatus } from "@/types";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "preparing", "ready", "delivered", "cancelled"];

const STATUS_BADGE_VARIANT: Record<string, "neutral" | "accent" | "gold" | "success" | "warning" | "error"> = {
  pending: "warning",
  preparing: "accent",
  ready: "gold",
  delivered: "success",
  cancelled: "error",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateOrder(id: number, patch: Partial<{ status: OrderStatus; estimated_delivery_minutes: number }>) {
    setSavingId(id);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? data.order : o)));
    }
    setSavingId(null);
  }

  return (
    <div>
      <h1 className="font-[var(--font-display)] text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Updates automatically every 10 seconds. Adjust delivery time per order as needed.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">No orders yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{order.reference}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {order.customer_name} · {order.customer_phone}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{order.customer_address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatPKR(order.total_pkr)}</p>
                  <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                </div>
              </div>

              <div className="mt-3 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-secondary)]">
                {order.items.map((item, i) => (
                  <span key={i}>
                    {item.quantity} × {item.name}
                    {i < order.items.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select
                  value={order.status}
                  disabled={savingId === order.id}
                  onChange={(e) => updateOrder(order.id, { status: e.target.value as OrderStatus })}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  Delivery time (min):
                  <input
                    type="number"
                    min={5}
                    max={240}
                    defaultValue={order.estimated_delivery_minutes}
                    disabled={savingId === order.id}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val !== order.estimated_delivery_minutes && val >= 5 && val <= 240) {
                        updateOrder(order.id, { estimated_delivery_minutes: val });
                      }
                    }}
                    className="w-16 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-sm"
                  />
                </label>

                <span className="ml-auto text-xs text-[var(--color-text-tertiary)]">
                  {new Date(order.created_at).toLocaleString("en-PK")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
