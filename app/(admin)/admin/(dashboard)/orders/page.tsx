"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatPKR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/misc";
import { PageHeader, EmptyState, LoadingRows } from "@/components/ui/layout-primitives";
import type { Order, OrderStatus } from "@/types";
import {
  ClipboardList,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Coins,
  ChevronRight,
  Eye,
  FileCheck,
} from "@/components/ui/icons";

const STATUS_FILTERS: (OrderStatus | "all")[] = ["all", "pending", "preparing", "ready", "delivered", "cancelled"];

const STATUS_BADGE_VARIANT: Record<string, "neutral" | "accent" | "gold" | "success" | "warning" | "error"> = {
  pending: "warning",
  preparing: "accent",
  ready: "gold",
  delivered: "success",
  cancelled: "error",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);

  // Use a ref so the stable `load` callback can always read the latest selectedOrder.id
  // without being re-created (which would restart the polling interval on every click).
  const selectedOrderIdRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        const newOrders = data.orders ?? [];
        setOrders(newOrders);

        // Keep the currently selected order up-to-date with new data from server
        const currentId = selectedOrderIdRef.current;
        if (currentId !== null) {
          const updatedSelected = newOrders.find((o: Order) => o.id === currentId);
          if (updatedSelected) {
            setSelectedOrder(updatedSelected);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []); // stable — no deps that change

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateOrder(
    id: number,
    patch: Partial<{ status: OrderStatus; estimated_delivery_minutes: number; payment_verified: number }>
  ) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === id ? data.order : o)));
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(data.order);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  }

  const filteredOrders = orders.filter((o) => filter === "all" || o.status === filter);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col justify-between gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-center">
        <div>
          <PageHeader title="Order Desk" subtitle="Live updates and instant order fulfillment alerts." />
        </div>
        <div className="flex overflow-x-auto gap-1 rounded-xl border border-[var(--color-border)] bg-white p-1 max-w-full" style={{scrollbarWidth:'none'}}>
          {STATUS_FILTERS.map((s) => {
            const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors sm:px-3 ${
                  filter === s
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent-dark)]"
                }`}
              >
                {s}
                {count > 0 && (
                  <span
                    className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      filter === s ? "bg-white/25 text-white" : "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mt-4 sm:mt-6 gap-4 sm:gap-6">
        {/* Left Column: Orders List — full width on mobile, fixed width on desktop */}
        <div className={`flex flex-col border border-[var(--color-border)] bg-white rounded-2xl overflow-hidden ${
          selectedOrder ? "hidden md:flex md:w-80 lg:w-96" : "w-full md:w-80 lg:w-96"
        }`}>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
            {loading ? (
              <div className="p-6">
                <LoadingRows count={5} />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8">
                <EmptyState title="No orders found" description="There are no orders matching this filter." />
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const dateStr = new Date(order.created_at).toLocaleString("en-PK", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <button
                    key={order.id}
                    onClick={() => {
                      selectedOrderIdRef.current = order.id;
                      setSelectedOrder(order);
                    }}
                    className={`w-full p-4 text-left transition-colors flex items-center justify-between group ${
                      isSelected
                        ? "bg-[var(--color-accent-light)]/40 border-l-4 border-[var(--color-accent)]"
                        : "hover:bg-[var(--color-surface)] border-l-4 border-transparent"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                          {order.reference}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">{dateStr}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)] truncate">
                        {order.customer_name} · {order.customer_phone}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)] truncate">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {formatPKR(order.total_pkr)}
                      </span>
                      <Badge variant={STATUS_BADGE_VARIANT[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column / Mobile Overlay: Order Detail Panel */}
        <div className={`${
          selectedOrder
            ? "fixed inset-0 z-40 flex flex-col bg-white md:relative md:inset-auto md:z-auto md:flex md:flex-1 md:rounded-2xl md:border md:border-[var(--color-border)] md:overflow-hidden"
            : "hidden md:flex md:flex-1 md:flex-col md:border md:border-[var(--color-border)] md:bg-white md:rounded-2xl md:overflow-hidden"
        }`}>
          {selectedOrder ? (
            <div className="flex h-full flex-col overflow-y-auto p-4 space-y-5 sm:p-6 sm:space-y-6">
              {/* Mobile back button */}
              <button
                onClick={() => {
                  selectedOrderIdRef.current = null;
                  setSelectedOrder(null);
                }}
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] md:hidden"
              >
                <ChevronRight className="h-4 w-4 rotate-180" /> Back to Orders
              </button>
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {selectedOrder.reference}
                    </h2>
                    <Badge variant={STATUS_BADGE_VARIANT[selectedOrder.status]}>
                      {ORDER_STATUS_LABELS[selectedOrder.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5">
                    Placed on{" "}
                    {new Date(selectedOrder.created_at).toLocaleString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>

                {/* Workflow Status Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedOrder.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateOrder(selectedOrder.id, { status: "preparing" })}
                        disabled={savingId === selectedOrder.id}
                        className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-accent-dark)] shadow-sm disabled:opacity-50"
                      >
                        Accept & Prepare
                      </button>
                      <button
                        onClick={() => updateOrder(selectedOrder.id, { status: "cancelled" })}
                        disabled={savingId === selectedOrder.id}
                        className="rounded-xl border border-[var(--color-error)] px-4 py-2 text-xs font-bold text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/5"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}

                  {selectedOrder.status === "preparing" && (
                    <button
                      onClick={() => updateOrder(selectedOrder.id, { status: "ready" })}
                      disabled={savingId === selectedOrder.id}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 shadow-sm"
                    >
                      Mark Ready for Delivery
                    </button>
                  )}

                  {selectedOrder.status === "ready" && (
                    <button
                      onClick={() => updateOrder(selectedOrder.id, { status: "delivered" })}
                      disabled={savingId === selectedOrder.id}
                      className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-accent-dark)] shadow-sm disabled:opacity-50"
                    >
                      Out for Delivery / Mark Delivered
                    </button>
                  )}

                  {(selectedOrder.status === "delivered" || selectedOrder.status === "cancelled") && (
                    <span className="text-xs text-[var(--color-text-tertiary)] italic">
                      Order is {selectedOrder.status} (Completed)
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Address & Customer Section */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3 rounded-2xl bg-[var(--color-surface)] p-5 border border-[var(--color-border)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[var(--color-accent)]" /> Delivery Location
                  </h3>
                  <div>
                    <p className="text-base font-bold text-[var(--color-text-primary)]">
                      {selectedOrder.customer_name}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--color-text-secondary)] bg-white/70 p-3 rounded-xl border border-[var(--color-border)]">
                      {selectedOrder.customer_address}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl bg-[var(--color-surface)] p-5 border border-[var(--color-border)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-[var(--color-accent)]" /> Contact Customer
                  </h3>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] select-all">
                      {selectedOrder.customer_phone}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <a
                        href={`tel:${selectedOrder.customer_phone}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] shadow-sm"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                      <a
                        href={`https://wa.me/${selectedOrder.customer_phone.replace(/\+/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] shadow-sm"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Verification Card */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-[var(--color-accent)]" /> Payment Details
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)]">Method</p>
                    <p className="text-sm font-bold capitalize mt-1 text-[var(--color-text-primary)]">
                      {selectedOrder.payment_method === "cod"
                        ? "Cash on Delivery (COD)"
                        : selectedOrder.payment_method}
                    </p>
                    {selectedOrder.payment_method === "cod" ? (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-[var(--color-accent)]" /> Pay in cash upon delivery
                      </p>
                    ) : (
                      <div className="mt-3 flex items-center gap-2">
                        {selectedOrder.payment_verified ? (
                          <span className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 px-2.5 py-1 text-xs font-bold text-[var(--color-accent)] shadow-sm">
                            <CheckCircle className="h-3.5 w-3.5" /> Paid & Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-sm">
                            <AlertTriangle className="h-3.5 w-3.5 animate-bounce" /> Awaiting Verification
                          </span>
                        )}

                        <button
                          onClick={() =>
                            updateOrder(selectedOrder.id, {
                              payment_verified: selectedOrder.payment_verified ? 0 : 1,
                            })
                          }
                          disabled={savingId === selectedOrder.id}
                          className="rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-bold transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] shadow-sm"
                        >
                          {selectedOrder.payment_verified ? "Reject Payment" : "Verify Payment"}
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedOrder.payment_method !== "cod" && (
                    <div className="flex flex-col justify-between border-t border-[var(--color-border)] pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
                      <div>
                        <p className="text-xs text-[var(--color-text-tertiary)] mb-1.5">Payment Screenshot</p>
                        {selectedOrder.payment_proof_url ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setShowProofModal(true)}
                              className="group relative flex h-14 w-14 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm transition-all hover:scale-105"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={selectedOrder.payment_proof_url}
                                alt="Payment proof"
                                className="h-full w-full object-cover transition-opacity group-hover:opacity-85"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                                <Eye className="h-3.5 w-3.5 text-white" />
                              </div>
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-[var(--color-text-secondary)] flex items-center gap-1">
                                <FileCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" /> AI Verification
                              </p>
                              <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight mt-0.5">
                                {selectedOrder.payment_ocr_result || "Scanning receipt details..."}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs italic text-[var(--color-error)]">
                            No screenshot uploaded by customer.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Estimation Adjuster */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[var(--color-accent)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Estimated Delivery Duration
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Current: {selectedOrder.estimated_delivery_minutes} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={240}
                      defaultValue={selectedOrder.estimated_delivery_minutes}
                      disabled={savingId === selectedOrder.id}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== selectedOrder.estimated_delivery_minutes && val >= 5 && val <= 240) {
                          updateOrder(selectedOrder.id, { estimated_delivery_minutes: val });
                        }
                      }}
                      className="w-16 rounded-xl border border-[var(--color-border)] px-3 py-2 text-center text-sm font-semibold focus:border-[var(--color-accent)] focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">min</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Order Items</h3>
                <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-white">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                        <th className="p-4">Item</th>
                        <th className="p-4 text-center">Qty</th>
                        <th className="p-4 text-right">Price</th>
                        <th className="p-4 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-secondary)]">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[var(--color-surface)]/40 transition-colors">
                          <td className="p-4 font-medium text-[var(--color-text-primary)]">{item.name}</td>
                          <td className="p-4 text-center">{item.quantity}</td>
                          <td className="p-4 text-right">{formatPKR(item.price_pkr)}</td>
                          <td className="p-4 text-right font-bold text-[var(--color-text-primary)]">
                            {formatPKR(item.price_pkr * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-end">
                <div className="w-full sm:w-80 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm">
                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Subtotal</span>
                    <span>{formatPKR(selectedOrder.subtotal_pkr)}</span>
                  </div>
                  {selectedOrder.discount_pkr > 0 && (
                    <div className="flex justify-between text-[var(--color-text-primary)] font-medium">
                      <span>Discount ({selectedOrder.coupon_code})</span>
                      <span>−{formatPKR(selectedOrder.discount_pkr)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Delivery Fee</span>
                    <span>{formatPKR(selectedOrder.delivery_fee_pkr)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[var(--color-text-primary)] border-t border-[var(--color-border)] pt-2.5">
                    <span>Total Bill</span>
                    <span>{formatPKR(selectedOrder.total_pkr)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div className="max-w-sm space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] mx-auto shadow-sm">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Select an Order</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Pick an order from the list on the left to see customer details, delivery location, items, and verification proof.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Lightbox Modal */}
      {showProofModal && selectedOrder?.payment_proof_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowProofModal(false)} />
          <div className="relative max-w-3xl max-h-[85vh] w-full bg-white rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
                Payment Screenshot: {selectedOrder.reference}
              </h4>
              <button
                onClick={() => setShowProofModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]"
              >
                <XCircle className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-[var(--color-surface)] flex items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedOrder.payment_proof_url}
                alt="Full receipt"
                className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-[var(--color-border)] bg-white"
              />
            </div>
            {selectedOrder.payment_ocr_result && (
              <div className="bg-[var(--color-surface)] px-5 py-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <span className="font-bold text-[var(--color-text-primary)] block mb-1">OCR Extracted Insights</span>
                {selectedOrder.payment_ocr_result}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
