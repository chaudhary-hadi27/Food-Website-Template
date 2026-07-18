"use client";

import { useEffect, useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingRows } from "@/components/ui/layout-primitives";

interface SettingsForm {
  restaurant_name: string;
  accent_color: string;
  delivery_fee_pkr: string;
  default_delivery_minutes: string;
  loyalty_pkr_per_point: string;
  phone: string;
  address: string;
  whatsapp: string;
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) =>
        setForm({
          restaurant_name: data.settings.restaurant_name ?? "",
          accent_color: data.settings.accent_color ?? "#c1272d",
          delivery_fee_pkr: data.settings.delivery_fee_pkr ?? "150",
          default_delivery_minutes: data.settings.default_delivery_minutes ?? "45",
          loyalty_pkr_per_point: data.settings.loyalty_pkr_per_point ?? "100",
          phone: data.settings.phone ?? "",
          address: data.settings.address ?? "",
          whatsapp: data.settings.whatsapp ?? "",
        })
      );
  }, []);

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
        accent_color: form.accent_color,
        delivery_fee_pkr: Number(form.delivery_fee_pkr),
        default_delivery_minutes: Number(form.default_delivery_minutes),
        loyalty_pkr_per_point: Number(form.loyalty_pkr_per_point),
        phone: form.phone,
        address: form.address,
        whatsapp: form.whatsapp,
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
          <div>
            <label className="mb-1.5 block text-sm font-medium">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => set("accent_color", e.target.value)}
                className="h-11 w-11 cursor-pointer rounded-lg border border-[var(--color-border)]"
              />
              <Input value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)} />
            </div>
          </div>
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
    </div>
  );
}
