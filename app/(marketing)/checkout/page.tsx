"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/features/cart/cart-context";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useLanguage } from "@/lib/i18n";

export default function CheckoutPage() {
  const { lines, subtotal, clearCart } = useCart();
  const { t } = useLanguage();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("cod");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(150);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_pkr: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const fee = Number(data.settings?.delivery_fee_pkr ?? 150);
        if (!Number.isNaN(fee)) setDeliveryFee(fee);
      })
      .catch(() => {});
  }, []);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-[var(--color-text-secondary)]">Your cart is empty.</p>
      </div>
    );
  }

  async function handleApplyCoupon() {
    setCouponError("");
    if (!couponInput.trim()) return;
    setCouponChecking(true);
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal_pkr: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon code.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: data.code, discount_pkr: data.discount_pkr });
    } catch {
      setCouponError("Couldn't verify coupon. Please try again.");
    } finally {
      setCouponChecking(false);
    }
  }

  const discount = appliedCoupon?.discount_pkr ?? 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          payment_method: payment,
          coupon_code: appliedCoupon?.code,
          items: lines.map((l) => ({
            menu_item_id: l.menu_item_id,
            name: l.name,
            price_pkr: l.price_pkr,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      clearCart();
      router.push(`/order/${data.order.reference}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-[var(--font-display)] text-3xl font-bold">{t("checkout")}</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <Input label={t("full_name")} required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmed Khan" />
          <Input
            label={t("phone_number")}
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03XXXXXXXXX"
            hint="Used for delivery updates and to track your loyalty points."
          />
          <Textarea
            label={t("delivery_address")}
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House/Street, Area, City"
          />

          <div>
            <label className="mb-2 block text-sm font-medium">{t("payment_method")}</label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    payment === m.value ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]" : "border-[var(--color-border)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.value}
                    checked={payment === m.value}
                    onChange={() => setPayment(m.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{m.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        </div>

        <div className="h-fit space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="text-sm font-semibold">{t("order_summary")}</h2>
          <div className="space-y-2 text-sm">
            {lines.map((l) => (
              <div key={l.menu_item_id} className="flex justify-between text-[var(--color-text-secondary)]">
                <span>
                  {l.quantity} × {l.name}
                </span>
                <span>{formatPKR(l.price_pkr * l.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--color-border)] pt-3">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Have a coupon?</label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  setAppliedCoupon(null);
                  setCouponError("");
                }}
                placeholder="e.g. WELCOME10"
                className="flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleApplyCoupon} loading={couponChecking}>
                Apply
              </Button>
            </div>
            {couponError && <p className="mt-1 text-xs text-[var(--color-error)]">{couponError}</p>}
            {appliedCoupon && (
              <p className="mt-1 text-xs text-[var(--color-success)]">
                ✓ {appliedCoupon.code} applied — {formatPKR(appliedCoupon.discount_pkr)} off
              </p>
            )}
          </div>

          <div className="border-t border-[var(--color-border)] pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">{t("subtotal")}</span>
              <span>{formatPKR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="mt-1 flex justify-between text-[var(--color-success)]">
                <span>Discount</span>
                <span>−{formatPKR(discount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between">
              <span className="text-[var(--color-text-secondary)]">{t("delivery_fee")}</span>
              <span>{formatPKR(deliveryFee)}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-semibold">
              <span>{t("total")}</span>
              <span>{formatPKR(total)}</span>
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {t("place_order")}
          </Button>
        </div>
      </form>
    </div>
  );
}
