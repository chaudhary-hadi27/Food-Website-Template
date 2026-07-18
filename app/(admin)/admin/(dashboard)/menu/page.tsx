"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/misc";
import { PageHeader, EmptyState, LoadingRows } from "@/components/ui/layout-primitives";
import { DataRow, DataRowThumb } from "@/components/ui/data-row";
import { Upload, UtensilsCrossed } from "@/components/ui/icons";
import type { MenuItem } from "@/types";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  price_pkr: 0,
  image_url: "",
  is_available: 1 as 0 | 1,
  is_bestseller: 0 as 0 | 1,
  rating: 4.5,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [menuRes, settingsRes] = await Promise.all([
      fetch("/api/menu"),
      fetch("/api/settings"),
    ]);
    const menuData = await menuRes.json();
    const settingsData = await settingsRes.json();

    setItems(menuData.items ?? []);

    const rawCats = settingsData.settings?.categories;
    const cats: string[] = rawCats
      ? JSON.parse(rawCats)
      : ["Gourmet Burgers", "Premium Sides", "Artisan Drinks", "Desserts"];
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setError("");
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
    setError("");
    setForm({ ...EMPTY_FORM, category: categories[0] ?? "" });
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
      <PageHeader
        title="Menu"
        subtitle="Add, edit, or remove dishes — changes appear on the site instantly."
        action={<Button onClick={startNew}><span className="mr-1">+</span> Add Dish</Button>}
      />

      {editingId !== null && (
        <div className="mt-6 rounded-2xl border border-[var(--color-accent)] bg-white p-6"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {editingId === "new" ? "Add New Dish" : "Edit Dish"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
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
              {/* Image preview */}
              {form.image_url && (
                <div className="mt-2 h-20 w-20 overflow-hidden rounded-xl border border-[var(--color-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
              {/* Upload button */}
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
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
                    if (!res.ok) { setError(data.error || "Upload failed."); return; }
                    setForm((prev) => ({ ...prev, image_url: data.url }));
                  }}
                />
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading..." : "Upload photo"}
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
                className="h-4 w-4 accent-[var(--color-accent)] rounded"
              />
              Available for ordering
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_bestseller === 1}
                onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked ? 1 : 0 })}
                className="h-4 w-4 accent-[var(--color-accent)] rounded"
              />
              Mark as Fan Favourite
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>}

          <div className="mt-5 flex gap-3">
            <Button onClick={handleSave} loading={saving}>Save</Button>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <LoadingRows count={4} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No dishes yet"
            description="Add your first dish to get your menu live."
            action={<Button onClick={startNew}><span className="mr-1">+</span> Add Dish</Button>}
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <DataRow
                key={item.id}
                leading={<DataRowThumb src={item.image_url} alt={item.name} />}
                primary={item.name}
                secondary={`${item.category} · ${formatPKR(item.price_pkr)}`}
                meta={
                  <>
                    {item.is_bestseller === 1 && <Badge variant="gold">Fan Favourite</Badge>}
                    {!item.is_available && <Badge variant="error">Unavailable</Badge>}
                  </>
                }
                trailing={
                  <>
                    <Button size="sm" variant="outline" onClick={() => toggleAvailability(item)}>
                      {item.is_available ? "Mark Unavailable" : "Mark Available"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>Delete</Button>
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
