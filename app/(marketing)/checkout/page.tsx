"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/features/cart/cart-context";
import { useCartSync } from "@/components/features/cart/use-cart-sync";
import { useStore } from "@/components/features/store/store-context";
import { Input, Textarea } from "@/components/ui/input";
import { LocationPicker, type DetectedLocation } from "@/components/features/checkout/location-picker";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useLanguage } from "@/lib/i18n";
import { Section, PageHeader, EmptyState } from "@/components/ui/layout-primitives";
import { Upload, CheckCircle2, AlertCircle } from "@/components/ui/icons";

export default function CheckoutPage() {
  const { lines, subtotal, clearCart } = useCart();
  const { t } = useLanguage();
  const router = useRouter();
  const { notices, dismiss, refresh } = useCartSync();
  const store = useStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [payment, setPayment] = useState("cod");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(150);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_pkr: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);

  // Payment proof upload state
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploadError, setUploadError] = useState("");

  // A price change invalidates any discount that was calculated on the old basket.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a cart change
    if (notices.length > 0) setAppliedCoupon(null);
  }, [notices.length]);

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
      <Section width="narrow" padY="lg">
        <EmptyState icon="🧾" title="Your cart is empty" description="Add something from the menu before checking out." />
      </Section>
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

  // Handle uploading of payment proof screenshot
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadingReceipt(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image.");
      }

      setPaymentProofUrl(data.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error && err.message ? err.message : "Something went wrong uploading screenshot.");
    } finally {
      setUploadingReceipt(false);
    }
  }

  const discount = appliedCoupon?.discount_pkr ?? 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate that payment proof is uploaded for online payment methods
    if (payment !== "cod" && !paymentProofUrl) {
      setError("Please upload a screenshot of your payment proof to place this order.");
      return;
    }

    if (!store.canOrder) {
      setError(store.message);
      return;
    }
    if (store.minOrderPkr > 0 && subtotal < store.minOrderPkr) {
      setError(`Kam az kam order ${formatPKR(store.minOrderPkr)} ka hona chahiye. / Minimum order is ${formatPKR(store.minOrderPkr)}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          ...(detectedLocation ? { customer_lat: detectedLocation.lat, customer_lng: detectedLocation.lng } : {}),
          payment_method: payment,
          payment_proof_url: paymentProofUrl,
          coupon_code: appliedCoupon?.code,
          expected_total: total,
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
        // Prices / availability changed under the customer: refresh the cart so the screen is true again.
        if (data.code === "price_changed") {
          setAppliedCoupon(null);
          await refresh();
        }
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
    <Section width="default" padY="default">
      <PageHeader title={t("checkout")} />
      {notices.length > 0 && (
        <div role="status" className="mt-4 space-y-1 rounded-xl border border-[var(--color-warning)]/40 bg-[#faf3df] p-4 text-sm text-[var(--color-warning)]">
          {notices.map((n) => (
            <p key={n}>⚠ {n}</p>
          ))}
          <button type="button" onClick={dismiss} className="mt-1 text-xs font-semibold underline">OK</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6 rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <Input label={t("full_name")} required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmed Khan" />
          <Input
            label={t("phone_number")}
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03XXXXXXXXX"
            hint="Used for delivery updates and to track your order."
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">{t("delivery_address")}</label>
            <LocationPicker
              detected={detectedLocation}
              onLocationDetected={(loc) => {
                setDetectedLocation(loc);
                setAddress(loc.address);
              }}
              onManualOverride={() => {
                setDetectedLocation(null);
                setAddress("");
              }}
            />
            <Textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Street, Area, City"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-[var(--color-text-primary)]">{t("payment_method")}</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => {
                const isSelected = payment === m.value;
                return (
                  <label
                    key={m.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:border-[var(--color-accent)] ${
                      isSelected
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] shadow-sm"
                        : "border-[var(--color-border)] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={m.value}
                      checked={isSelected}
                      onChange={() => {
                        setPayment(m.value);
                        setError("");
                      }}
                      className="mt-1 accent-[var(--color-accent)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">{m.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">{m.hint}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Payment Proof Screenshot Uploader (Non-COD) */}
          {payment !== "cod" && (
            <div className="rounded-xl border border-dashed border-[var(--color-accent)]/50 bg-[var(--color-accent-light)]/20 p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                  Upload Payment Verification Screenshot
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Send your total bill amount to our accounts as listed above and upload the receipt screenshot here.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-xs font-bold text-white transition-colors hover:bg-[var(--color-accent-dark)] shadow-sm">
                  <Upload className="h-4 w-4" />
                  {uploadingReceipt ? "Uploading..." : "Upload Screenshot"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingReceipt}
                  />
                </label>

                {paymentProofUrl ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-accent)]">
                    <CheckCircle2 className="h-4 w-4" /> Screenshot uploaded successfully!
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                    No receipt uploaded yet.
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-error)]">
                  <AlertCircle className="h-4 w-4" /> {uploadError}
                </div>
              )}

              {paymentProofUrl && (
                <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={paymentProofUrl}
                    alt="Receipt preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-[var(--color-error)]">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="h-fit space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
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
              <p className="mt-1 text-xs text-[var(--color-accent)] font-medium">
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
              <div className="mt-1 flex justify-between text-[var(--color-accent)] font-medium">
                <span>Discount</span>
                <span>−{formatPKR(discount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between">
              <span className="text-[var(--color-text-secondary)]">{t("delivery_fee")}</span>
              <span>{formatPKR(deliveryFee)}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-bold text-[var(--color-text-primary)]">
              <span>{t("total")}</span>
              <span>{formatPKR(total)}</span>
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!store.canOrder}>
            {t("place_order")}
          </Button>
        </div>
      </form>
    </Section>
  );
}
