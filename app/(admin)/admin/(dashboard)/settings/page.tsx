"use client";

import { useEffect, useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingRows } from "@/components/ui/layout-primitives";
import { isCurrentlyOpen, formatTimeLabel } from "@/lib/business-hours";
import { getPushState, enableOrderAlerts, disableOrderAlerts, type PushSetupState } from "@/lib/push-client";
import { playNewOrderAlert } from "@/lib/order-alert-sound";
import { LocationPicker, type DetectedLocation } from "@/components/features/checkout/location-picker";
import { Bell, BellOff } from "@/components/ui/icons";

interface SettingsForm {
  restaurant_name: string;
  delivery_fee_pkr: string;
  default_delivery_minutes: string;
  loyalty_pkr_per_point: string;
  phone: string;
  address: string;
  whatsapp: string;
  business_open_time: string;
  business_close_time: string;
  new_order_alert_audio_url: string;
  restaurant_lat: string;
  restaurant_lng: string;
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushState, setPushState] = useState<PushSetupState | "checking">("checking");
  const [pushBusy, setPushBusy] = useState(false);
  const [restaurantLocation, setRestaurantLocation] = useState<DetectedLocation | null>(null);
  const [reviews, setReviews] = useState<{ name: string; text: string; item: string }[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const lat = Number(data.settings.restaurant_lat ?? 31.5204);
        const lng = Number(data.settings.restaurant_lng ?? 74.3587);
        setForm({
          restaurant_name: data.settings.restaurant_name ?? "",
          delivery_fee_pkr: data.settings.delivery_fee_pkr ?? "150",
          default_delivery_minutes: data.settings.default_delivery_minutes ?? "45",
          loyalty_pkr_per_point: data.settings.loyalty_pkr_per_point ?? "100",
          phone: data.settings.phone ?? "",
          address: data.settings.address ?? "",
          whatsapp: data.settings.whatsapp ?? "",
          business_open_time: data.settings.business_open_time ?? "12:00",
          business_close_time: data.settings.business_close_time ?? "02:00",
          new_order_alert_audio_url: data.settings.new_order_alert_audio_url ?? "",
          restaurant_lat: String(lat),
          restaurant_lng: String(lng),
        });
        try {
          const parsed = data.settings.homepage_reviews ? JSON.parse(data.settings.homepage_reviews) : [];
          if (Array.isArray(parsed)) {
            setReviews(parsed.map((r: { name?: string; text?: string; item?: string }) => ({
              name: r.name ?? "", text: r.text ?? "", item: r.item ?? "",
            })));
          }
        } catch { /* ignore malformed JSON */ }
        // Pre-fill the picker with the currently saved pin so there's always something to
        // see/adjust, rather than making the admin re-detect from scratch every visit.
        setRestaurantLocation({ address: "Current saved location — drag to adjust", lat, lng });
      });
    getPushState().then(setPushState);
  }, []);

  async function togglePush() {
    setPushBusy(true);
    try {
      const next = pushState === "subscribed" ? await disableOrderAlerts() : await enableOrderAlerts();
      setPushState(next);
    } finally {
      setPushBusy(false);
    }
  }

  if (!form) return <div className="max-w-2xl"><LoadingRows count={3} /></div>;

  function set<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_name: form.restaurant_name,
        delivery_fee_pkr: Number(form.delivery_fee_pkr),
        default_delivery_minutes: Number(form.default_delivery_minutes),
        loyalty_pkr_per_point: Number(form.loyalty_pkr_per_point),
        phone: form.phone,
        address: form.address,
        whatsapp: form.whatsapp,
        business_open_time: form.business_open_time,
        business_close_time: form.business_close_time,
        new_order_alert_audio_url: form.new_order_alert_audio_url,
        restaurant_lat: Number(form.restaurant_lat),
        restaurant_lng: Number(form.restaurant_lng),
        homepage_reviews: JSON.stringify(
          reviews
            .filter((r) => r.name.trim() && r.text.trim())
            .map((r) => ({ name: r.name.trim(), text: r.text.trim(), item: r.item.trim() }))
        ),
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Site Settings" subtitle="Everything here updates the live site immediately — no developer needed." />

      <div className="mt-6 space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <Input label="Restaurant Name" value={form.restaurant_name} onChange={(e) => set("restaurant_name", e.target.value)} />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Delivery Fee (PKR)"
            type="number"
            value={form.delivery_fee_pkr}
            onChange={(e) => set("delivery_fee_pkr", e.target.value)}
          />
        </div>

        <Input
          label="Default Delivery Time (minutes)"
          type="number"
          value={form.default_delivery_minutes}
          onChange={(e) => set("default_delivery_minutes", e.target.value)}
          hint="Applied to every new order automatically. You can still override it per order from the Orders page."
        />

        <Input
          label="Loyalty Points (PKR spent per 1 point)"
          type="number"
          value={form.loyalty_pkr_per_point}
          onChange={(e) => set("loyalty_pkr_per_point", e.target.value)}
          hint="e.g. 100 means a customer earns 1 point for every PKR 100 spent."
        />

        <Input label="Phone Number" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <Input label="WhatsApp Number" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        <Textarea label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          {saved && <span className="text-sm text-[var(--color-success)]">✓ Saved</span>}
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Business Hours</h3>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Your day doesn&apos;t end at midnight — it ends when the counter closes. The Order Desk resets for a
            new day right at your closing time, even if that&apos;s 2am or 4am.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Opens at"
            type="time"
            value={form.business_open_time}
            onChange={(e) => set("business_open_time", e.target.value)}
          />
          <Input
            label="Closes at"
            type="time"
            value={form.business_close_time}
            onChange={(e) => set("business_close_time", e.target.value)}
            hint="Earlier than 'Opens at' just means you close after midnight — that's handled automatically."
          />
        </div>

        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${
            isCurrentlyOpen(form.business_open_time, form.business_close_time)
              ? "bg-[#e8f5ea] text-[var(--color-success)]"
              : "bg-[#fbe9e9] text-[var(--color-error)]"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {isCurrentlyOpen(form.business_open_time, form.business_close_time) ? "Open now" : "Closed now"} —{" "}
          {formatTimeLabel(form.business_open_time)} to {formatTimeLabel(form.business_close_time)}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          {saved && <span className="text-sm text-[var(--color-success)]">✓ Saved</span>}
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Customer Reviews (homepage)</h3>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Add only REAL reviews from your customers (ask permission first). If you add none, the reviews
            section is simply hidden — nothing is made up. Up to 6.
          </p>
        </div>

        {reviews.map((r, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-[var(--color-border)] p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Customer name"
                value={r.name}
                maxLength={60}
                onChange={(e) => { setReviews((prev) => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))); setSaved(false); }}
              />
              <Input
                label="Dish (optional)"
                value={r.item}
                maxLength={60}
                onChange={(e) => { setReviews((prev) => prev.map((x, j) => (j === i ? { ...x, item: e.target.value } : x))); setSaved(false); }}
              />
            </div>
            <Textarea
              label="What they said"
              value={r.text}
              maxLength={300}
              onChange={(e) => { setReviews((prev) => prev.map((x, j) => (j === i ? { ...x, text: e.target.value } : x))); setSaved(false); }}
            />
            <button
              type="button"
              onClick={() => { setReviews((prev) => prev.filter((_, j) => j !== i)); setSaved(false); }}
              className="text-xs font-bold text-[var(--color-error)] hover:underline"
            >
              Remove this review
            </button>
          </div>
        ))}

        {reviews.length < 6 && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => { setReviews((prev) => [...prev, { name: "", text: "", item: "" }]); setSaved(false); }}
          >
            + Add a review
          </Button>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          {saved && <span className="text-sm text-[var(--color-success)]">✓ Saved</span>}
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Restaurant Location</h3>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            This exact pin is what delivery-distance calculations in Orders and History are measured from —
            it&apos;s worth getting precise. Stand at your counter and tap &quot;Use My Current Location&quot;, or
            drag the pin on the map below.
          </p>
        </div>

        <LocationPicker
          detected={restaurantLocation}
          onLocationDetected={(loc) => {
            setRestaurantLocation(loc);
            set("restaurant_lat", String(loc.lat));
            set("restaurant_lng", String(loc.lng));
          }}
          onManualOverride={() => setRestaurantLocation(null)}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          {saved && <span className="text-sm text-[var(--color-success)]">✓ Saved</span>}
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Order Alerts</h3>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Get a loud Roman Urdu voice alert — &quot;Naya order aa gaya hai, dashboard check karein!&quot; — the
            moment a new order comes in, plus a notification even if this tab is in the background.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={togglePush} loading={pushBusy} variant={pushState === "subscribed" ? "secondary" : "primary"}>
            {pushState === "subscribed" ? (
              <span className="flex items-center gap-2"><BellOff className="h-4 w-4" /> Turn Off Alerts (this device)</span>
            ) : (
              <span className="flex items-center gap-2"><Bell className="h-4 w-4" /> Turn On Order Alerts</span>
            )}
          </Button>
          <button
            onClick={() => playNewOrderAlert()}
            className="text-xs font-bold text-[var(--color-accent)] hover:underline"
          >
            🔊 Test the sound
          </button>
        </div>

        {pushState === "denied" && (
          <p className="text-xs font-semibold text-[var(--color-error)]">
            Notifications are blocked for this site in your browser. Enable them in your browser&apos;s site
            settings, then try again.
          </p>
        )}
        {pushState === "not-configured" && (
          <p className="text-xs font-semibold text-[var(--color-error)]">
            Push notifications aren&apos;t configured on the server yet (missing VAPID keys) — see CHANGES.md.
            The voice alert will still work via polling while this tab is open.
          </p>
        )}
        {pushState === "unsupported" && (
          <p className="text-xs text-[var(--color-text-tertiary)]">
            This browser doesn&apos;t support push notifications. On iPhone, add this site to your Home Screen
            first (Safari → Share → Add to Home Screen), then open it from there to enable alerts.
          </p>
        )}

        <Input
          label="Alert Audio URL (optional)"
          value={form.new_order_alert_audio_url}
          onChange={(e) => set("new_order_alert_audio_url", e.target.value)}
          placeholder="https://res.cloudinary.com/.../new-order-alert.mp3"
          hint="A pre-recorded human voice clip sounds much better than the built-in robot voice. Leave blank to use your browser's built-in speech synthesis automatically."
        />

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          {saved && <span className="text-sm text-[var(--color-success)]">✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}
