"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPKR, haversineDistanceKm, buildRiderShareWhatsAppUrl } from "@/lib/utils";
import { ORDER_STATUS_LABELS, RESTAURANT_COORDS as DEFAULT_RESTAURANT_COORDS, STATUS_BADGE_VARIANT, ROW_STATUS_BG } from "@/lib/constants";
import { Badge } from "@/components/ui/misc";
import { PageHeader, EmptyState, LoadingRows } from "@/components/ui/layout-primitives";
import { LeafletMap } from "@/components/ui/leaflet-map";
import { AnimatedModal } from "@/components/ui/animated-modal";
import type { Order } from "@/types";
import {
  Phone,
  MessageSquare,
  MapPin,
  MapPinned,
  Navigation,
  XCircle,
  Download,
  ChevronLeft,
  ChevronRight,
} from "@/components/ui/icons";

type Range = "today" | "week" | "month" | "year" | "custom";

const RANGE_OPTIONS: { key: Range; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

const PAGE_SIZE = 25;

export default function AdminHistoryPage() {
  const [range, setRange] = useState<Range>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomPanel, setShowCustomPanel] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [restaurantCoords, setRestaurantCoords] = useState(DEFAULT_RESTAURANT_COORDS);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (r: Range, pageNum: number, from?: string, to?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope: "all",
        range: r,
        limit: String(PAGE_SIZE),
        offset: String((pageNum - 1) * PAGE_SIZE),
      });
      if (r === "custom" && from && to) {
        params.set("from", from);
        params.set("to", to);
      }
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setTotal(Number(data.total ?? 0));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const lat = Number(data.settings?.restaurant_lat);
        const lng = Number(data.settings?.restaurant_lng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) setRestaurantCoords({ lat, lng });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/page-change
    load(range, page, customFrom, customTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleRangeChange(r: Range) {
    setRange(r);
    setSelectedOrder(null);
    if (r === "custom") {
      setShowCustomPanel(true);
      return;
    }
    setShowCustomPanel(false);
    setPage(1);
    load(r, 1);
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) return;
    setShowCustomPanel(false);
    setPage(1);
    load("custom", 1, customFrom, customTo);
  }

  function exportCsv() {
    const params = new URLSearchParams({ range });
    if (range === "custom" && customFrom && customTo) {
      params.set("from", customFrom);
      params.set("to", customTo);
    }
    window.location.href = `/api/orders/export?${params.toString()}`;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-4 border-b border-[var(--color-border)] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader title="Order History" subtitle="Every order, ever — search, review, and export." />
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-accent-dark)]"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          <div className="flex overflow-x-auto gap-1 rounded-xl border border-[var(--color-border)] bg-white p-1" style={{ scrollbarWidth: "none" }}>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleRangeChange(opt.key)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  range === opt.key
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent-dark)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {showCustomPanel && (
            <div className="absolute left-0 top-full z-20 mt-2 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-lg">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[var(--color-text-secondary)]">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  max={customTo || new Date().toISOString().slice(0, 10)}
                  className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[var(--color-text-secondary)]">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  min={customFrom || undefined}
                  max={new Date().toISOString().slice(0, 10)}
                  className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
              <button
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-accent-dark)] disabled:opacity-40"
              >
                Apply
              </button>
              <button
                onClick={() => setShowCustomPanel(false)}
                className="text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              >
                Cancel
              </button>
            </div>
          )}

          <span className="text-xs text-[var(--color-text-tertiary)]">{total} order{total === 1 ? "" : "s"} found</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mt-4 sm:mt-6 gap-4 sm:gap-6">
        {/* Left Column: Orders List */}
        <div
          className={`flex flex-col border border-[var(--color-border)] bg-white rounded-2xl overflow-hidden ${
            selectedOrder ? "hidden md:flex md:w-80 lg:w-96" : "w-full md:w-80 lg:w-96"
          }`}
        >
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
            {loading ? (
              <div className="p-6">
                <LoadingRows count={6} />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8">
                <EmptyState icon="🕓" title="No orders in this range" description="Try a wider date range." />
              </div>
            ) : (
              orders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const dateStr = new Date(order.created_at).toLocaleString("en-PK", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full p-4 text-left transition-colors flex items-center justify-between group ${
                      isSelected
                        ? "bg-[var(--color-accent-light)]/40 border-l-4 border-[var(--color-accent)]"
                        : `${ROW_STATUS_BG[order.status] ?? "hover:bg-[var(--color-surface)]"} border-l-4 border-transparent`
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--color-text-primary)]">{order.reference}</span>
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">{dateStr}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)] truncate">
                        {order.customer_name} · {order.customer_phone}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">{formatPKR(order.total_pkr)}</span>
                      <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* True page-by-page navigation — never accumulates thousands of rows in the DOM */}
          <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border)] p-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] disabled:opacity-30"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Order Detail (read-focused — same visual language as the Order Desk) */}
        <div className={`${selectedOrder ? "flex" : "hidden md:flex"} flex-1 flex-col rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden`}>
          {!selectedOrder ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState icon="🕓" title="Select an order" description="Pick an order from the list to see full details." />
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
                <div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="mb-2 flex items-center gap-1 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] md:hidden"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back to list
                  </button>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{selectedOrder.reference}</h2>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {new Date(selectedOrder.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[selectedOrder.status]}>{ORDER_STATUS_LABELS[selectedOrder.status]}</Badge>
              </div>

              <div className="flex-1 space-y-5 p-5">
                <div className="space-y-3 rounded-2xl bg-[var(--color-surface)] p-5 border border-[var(--color-border)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[var(--color-accent)]" /> Delivery Location
                  </h3>
                  <p className="text-base font-bold text-[var(--color-text-primary)]">{selectedOrder.customer_name}</p>
                  <p className="text-sm font-semibold leading-relaxed text-[var(--color-text-secondary)] bg-white/70 p-3 rounded-xl border border-[var(--color-border)]">
                    {selectedOrder.customer_address}
                  </p>
                  {selectedOrder.customer_lat != null && selectedOrder.customer_lng != null && (
                    <button
                      onClick={() => setShowLocationModal(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-light)] px-3 py-1.5 text-xs font-bold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
                    >
                      <MapPinned className="h-3.5 w-3.5" /> View on Map & Distance
                    </button>
                  )}
                  <a
                    href={buildRiderShareWhatsAppUrl(selectedOrder)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 transition-colors hover:bg-green-600 hover:text-white"
                  >
                    <Navigation className="h-3.5 w-3.5" /> Share to Rider
                  </a>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${selectedOrder.customer_phone}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 shadow-sm"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                    <a
                      href={`https://wa.me/${selectedOrder.customer_phone.replace(/\+/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-3.5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-green-700 shadow-sm"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Order Items</h3>
                  <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-secondary)]">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="border-l-4 border-[var(--color-accent)]/70 odd:bg-[var(--color-accent-light)]/15">
                            <td className="p-4 font-bold text-[var(--color-text-primary)]">{item.name}</td>
                            <td className="p-4 text-center">
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--color-accent-light)] px-2 text-xs font-bold text-[var(--color-accent-dark)]">
                                {item.quantity}
                              </span>
                            </td>
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

                <div className="flex justify-between rounded-2xl bg-[var(--color-surface)] p-4 text-sm font-bold">
                  <span className="text-[var(--color-text-secondary)]">Total</span>
                  <span className="text-[var(--color-text-primary)]">{formatPKR(selectedOrder.total_pkr)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedOrder?.customer_lat != null && selectedOrder?.customer_lng != null && (
        <AnimatedModal
          open={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          panelClassName="w-full max-w-lg flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Delivery Location: {selectedOrder.reference}</h4>
            <button
              onClick={() => setShowLocationModal(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]"
            >
              <XCircle className="h-5 w-5 text-[var(--color-text-secondary)]" />
            </button>
          </div>
          <LeafletMap
            center={{ lat: selectedOrder.customer_lat, lng: selectedOrder.customer_lng }}
            markers={[
              { lat: selectedOrder.customer_lat, lng: selectedOrder.customer_lng, label: selectedOrder.customer_name },
              { lat: restaurantCoords.lat, lng: restaurantCoords.lng, label: "Restaurant", variant: "accent" },
            ]}
            drawLineBetweenFirstTwo
            height={260}
            zoom={13}
          />
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Straight-line Distance</span>
              <span className="text-lg font-bold text-[var(--color-accent)]">
                {haversineDistanceKm(restaurantCoords.lat, restaurantCoords.lng, selectedOrder.customer_lat, selectedOrder.customer_lng).toFixed(1)} km
              </span>
            </div>
          </div>
        </AnimatedModal>
      )}
    </div>
  );
}
