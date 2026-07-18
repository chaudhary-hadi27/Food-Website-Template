"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPKR } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS } from "@/lib/constants";
import { Badge } from "@/components/ui/misc";
import type { Order } from "@/types";

/* ---------- countdown hook ---------- */
function useCountdown(createdAt: string, estimatedMinutes: number) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    function tick() {
      const target = new Date(createdAt).getTime() + estimatedMinutes * 60_000;
      const diff = target - Date.now();
      if (diff <= 0) { setRemaining("Arriving any moment 🛵"); return; }
      const mins = Math.floor(diff / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      setRemaining(`${mins}m ${secs.toString().padStart(2, "0")}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt, estimatedMinutes]);
  return remaining;
}

/* ---------- canvas-based PNG download ---------- */
async function downloadTrackingCard(reference: string, total: string) {
  const W = 720, H = 360;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#ff6a00");
  grad.addColorStop(1, "#ee0979");
  ctx.fillStyle = grad;
  ctx.roundRect(0, 0, W, H, 24);
  ctx.fill();

  // Subtle pattern circles
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(W - 80, -40, 160, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(60, H + 40, 120, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Brand name
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText("🔥 FLAMING BITES", 48, 64);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(48, 80); ctx.lineTo(W - 48, 80); ctx.stroke();

  // "Order Confirmed!" label
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 14px system-ui, sans-serif";
  ctx.fillText("ORDER CONFIRMED", 48, 116);

  // Tracking reference — big
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px monospace";
  ctx.fillText(reference, 48, 192);

  // Total
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "500 18px system-ui, sans-serif";
  ctx.fillText(`Total: ${total}`, 48, 236);

  // Instruction footer
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText("Use this reference to track your delivery at flamingbites.com/track", 48, 310);

  // Date
  const dateStr = new Date().toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText(dateStr, 48, 336);

  // Download
  const link = document.createElement("a");
  link.download = `flaming-bites-order-${reference}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/* ---------- main page component ---------- */
export default function OrderTrackingPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [justPlaced, setJustPlaced] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/orders/track/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  // Auto-hide the "success" banner after 6 seconds
  useEffect(() => {
    timerRef.current = setTimeout(() => setJustPlaced(false), 6000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const countdown = useCountdown(
    order?.created_at ?? new Date().toISOString(),
    order?.estimated_delivery_minutes ?? 45
  );

  async function handleDownload() {
    if (!order) return;
    setDownloading(true);
    try {
      await downloadTrackingCard(order.reference, formatPKR(order.total_pkr));
    } finally {
      setDownloading(false);
    }
  }

  /* ----- states ----- */
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="animate-pulse space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-[var(--color-accent-light)]" />
          <div className="h-4 w-48 rounded bg-[var(--color-border)] mx-auto" />
          <div className="h-3 w-32 rounded bg-[var(--color-border)] mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-sm text-[var(--color-text-secondary)]">We couldn&apos;t find that order.</p>
        <Link href="/menu" className="mt-4 inline-block text-sm font-medium text-[var(--color-accent)]">Back to menu →</Link>
      </div>
    );
  }

  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(order.status as typeof ORDER_STATUS_STEPS[number]);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 space-y-6">

      {/* ── Success Banner (auto-dismisses) ── */}
      {justPlaced && (
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{ background: "linear-gradient(135deg, #ff6a00, #ee0979)" }}
        >
          {/* decorative blobs */}
          <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute -bottom-8 -left-6 h-32 w-32 rounded-full bg-white/10" />

          <div className="relative flex items-start gap-4">
            <span className="text-4xl leading-none select-none">🎉</span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight">Order Placed Successfully!</h1>
              <p className="mt-1 text-sm text-white/80">
                Your order <span className="font-mono font-bold">{order.reference}</span> has been received.
                We&apos;re preparing it right now.
              </p>
            </div>
          </div>

          {/* dismiss progress bar */}
          <div className="relative mt-4 h-0.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-white/60 rounded-full"
              style={{ animation: "shrink-bar 6s linear forwards" }}
            />
          </div>
          <style>{`
            @keyframes shrink-bar {
              from { width: 100%; }
              to   { width: 0%; }
            }
          `}</style>
        </div>
      )}

      {/* ── Tracking Card ── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
        {/* coloured header strip */}
        <div
          className="px-6 py-5 text-white"
          style={{ background: "linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">Tracking Number</p>
          <p className="font-mono text-3xl font-bold tracking-wider">{order.reference}</p>
        </div>

        <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-[var(--color-text-secondary)]">
            Save this number to track your delivery.
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-bold text-[var(--color-text-primary)] shadow-sm transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-60 shrink-0"
          >
            {downloading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            )}
            Download as PNG
          </button>
        </div>
      </div>

      {/* ── ETA countdown ── */}
      {!isCancelled && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent-light)] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-dark)]">Estimated Arrival</p>
          <p className="mt-2 font-mono text-4xl font-bold text-[var(--color-accent-dark)]">{countdown}</p>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-2xl border border-[var(--color-error)] bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-[var(--color-error)]">This order was cancelled.</p>
        </div>
      )}

      {/* ── Status stepper ── */}
      {!isCancelled && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-5">Order Progress</p>
          <div className="relative flex items-start justify-between">
            {/* connecting line */}
            <div className="absolute left-[18px] right-[18px] top-[18px] h-0.5 bg-[var(--color-border)]" />
            <div
              className="absolute left-[18px] top-[18px] h-0.5 bg-[var(--color-accent)] transition-all duration-700"
              style={{
                width: currentStepIndex > 0
                  ? `calc(${(currentStepIndex / (ORDER_STATUS_STEPS.length - 1)) * 100}% )`
                  : "0%"
              }}
            />
            {ORDER_STATUS_STEPS.map((step, i) => (
              <div key={step} className="relative flex flex-col items-center gap-2 flex-1">
                <div
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    i < currentStepIndex
                      ? "bg-[var(--color-accent)] text-white shadow-md"
                      : i === currentStepIndex
                      ? "bg-[var(--color-accent)] text-white shadow-lg ring-4 ring-[var(--color-accent-light)]"
                      : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border border-[var(--color-border)]"
                  }`}
                >
                  {i < currentStepIndex ? "✓" : i + 1}
                </div>
                <p className="text-center text-[11px] leading-tight text-[var(--color-text-secondary)] max-w-[60px]">
                  {ORDER_STATUS_LABELS[step]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Order details ── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Order Details</h2>
          <Badge variant="neutral">{order.payment_method.replace("_", " ")}</Badge>
        </div>
        <div className="space-y-2 text-sm">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-[var(--color-text-secondary)]">
              <span>{item.quantity} × {item.name}</span>
              <span>{formatPKR(item.price_pkr * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-[var(--color-border)] pt-4 flex justify-between text-sm font-bold text-[var(--color-text-primary)]">
          <span>Total</span>
          <span>{formatPKR(order.total_pkr)}</span>
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
          📍 Delivering to: {order.customer_address}
        </p>
      </div>

      <Link href="/menu" className="block text-center text-sm font-medium text-[var(--color-accent)] hover:underline">
        ← Order something else
      </Link>
    </div>
  );
}
