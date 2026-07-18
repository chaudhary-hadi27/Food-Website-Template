"use client";

import { useEffect, useState, useCallback } from "react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { PageHeader, EmptyState, LoadingRows } from "@/components/ui/layout-primitives";
import { DataRow } from "@/components/ui/data-row";
import type { Coupon, DiscountType } from "@/types";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<DiscountType>("percent");
  const [value, setValue] = useState(10);
  const [maxUses, setMaxUses] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/coupons");
    if (res.ok) {
      const data = await res.json();
      setCoupons(data.coupons ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        discount_type: type,
        discount_value: value,
        max_uses: maxUses ? Number(maxUses) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create coupon.");
      setSaving(false);
      return;
    }
    setCode("");
    setValue(10);
    setMaxUses("");
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function toggleActive(coupon: Coupon) {
    await fetch(`/api/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: coupon.is_active ? 0 : 1 }),
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Coupons"
        subtitle="Create discount codes customers can apply at checkout."
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ New Coupon"}</Button>}
      />

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 space-y-4 rounded-2xl border border-[var(--color-accent)] bg-white p-6">
          <Input
            label="Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. WELCOME10"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Discount Type" value={type} onChange={(e) => setType(e.target.value as DiscountType)}>
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed Amount (PKR)</option>
            </Select>
            <Input
              label={type === "percent" ? "Percent Off" : "Amount Off (PKR)"}
              type="number"
              required
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </div>
          <Input
            label="Max Uses (optional)"
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Leave blank for unlimited"
          />
          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
          <Button type="submit" loading={saving}>Create Coupon</Button>
        </form>
      )}

      <div className="mt-6">
        {loading ? (
          <LoadingRows count={3} />
        ) : coupons.length === 0 ? (
          <EmptyState icon="🏷️" title="No coupons yet" description="Create a code to offer customers a discount at checkout." action={<Button onClick={() => setShowForm(true)}>+ New Coupon</Button>} />
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => (
              <DataRow
                key={c.id}
                primary={c.code}
                secondary={
                  c.discount_type === "percent"
                    ? `${c.discount_value}% off · Used ${c.usage_count}${c.max_uses ? ` / ${c.max_uses}` : ""} times`
                    : `PKR ${c.discount_value} off · Used ${c.usage_count}${c.max_uses ? ` / ${c.max_uses}` : ""} times`
                }
                meta={<Badge variant={c.is_active ? "success" : "neutral"}>{c.is_active ? "Active" : "Disabled"}</Badge>}
                trailing={
                  <>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                      {c.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>Delete</Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
