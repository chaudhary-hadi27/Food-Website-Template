"use client";

import { useEffect, useState, useCallback } from "react";
import { CATEGORIES } from "@/lib/constants";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/misc";
import type { MenuItem } from "@/types";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: CATEGORIES[0] as string,
  price_pkr: 0,
  image_url: "",
  is_available: 1 as 0 | 1,
  is_bestseller: 0 as 0 | 1,
  rating: 4.5,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/menu");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      price_pkr: item.price_pkr,
      image_url: item.image_url,
      is_available: item.is_available,
      is_bestseller: item.is_bestseller,
      rating: item.rating,
    });
  }

  function startNew() {
    setEditingId("new");
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const isNew = editingId === "new";
    const url = isNew ? "/api/menu" : `/api/menu/${editingId}`;
    const method = isNew ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save.");
      setSaving(false);
      return;
    }
    setEditingId(null);
    setSaving(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    await fetch(`/api/menu/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleAvailability(item: MenuItem) {
    await fetch(`/api/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: item.is_available ? 0 : 1 }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold">Menu</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Add, edit, or remove dishes — changes appear on the site instantly.
          </p>
        </div>
        <Button onClick={startNew}>+ Add Dish</Button>
      </div>

      {editingId !== null && (
        <div className="mt-6 rounded-2xl border border-[var(--color-accent)] bg-white p-6">
          <h2 className="text-sm font-semibold">{editingId === "new" ? "Add New Dish" : "Edit Dish"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input
              label="Price (PKR)"
              type="number"
              value={form.price_pkr}
              onChange={(e) => setForm({ ...form, price_pkr: Number(e.target.value) })}
            />
            <div>
              <Input
                label="Image URL"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://... or upload below"
              />
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--color-accent)]">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    setError("");
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    setUploading(false);
                    if (!res.ok) {
                      setError(data.error || "Upload failed.");
                      return;
                    }
                    setForm((prev) => ({ ...prev, image_url: data.url }));
                  }}
                />
                {uploading ? "Uploading..." : "📤 Or upload a photo from your device"}
              </label>
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_available === 1}
                onChange={(e) => setForm({ ...form, is_available: e.target.checked ? 1 : 0 })}
              />
              Available for ordering
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_bestseller === 1}
                onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked ? 1 : 0 })}
              />
              Mark as bestseller
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>}

          <div className="mt-5 flex gap-3">
            <Button onClick={handleSave} loading={saving}>Save</Button>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Loading menu...</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--color-surface)]">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">🍔</div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{item.category} · {formatPKR(item.price_pkr)}</p>
                </div>
                {item.is_bestseller === 1 && <Badge variant="gold">Bestseller</Badge>}
                {!item.is_available && <Badge variant="error">Unavailable</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleAvailability(item)}>
                  {item.is_available ? "Mark Unavailable" : "Mark Available"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>Delete</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
