"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPKR, optimizeImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingRows } from "@/components/ui/layout-primitives";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Pencil,
  ChevronDown,
  UtensilsCrossed,
} from "@/components/ui/icons";
import { parseCategories, resolveSections, type HomepageSection } from "@/lib/homepage-layout";
import type { MenuItem } from "@/types";

/**
 * Homepage = your categories, in this order. Each category is one swipe-sideways row on the
 * homepage and automatically contains EVERY available item of that category. Nothing to
 * pick by hand: add an item in Menu → it appears; mark it sold out or delete it → it goes.
 */
export default function HomepageDesignerPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busyItem, setBusyItem] = useState<number | null>(null);

  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatVal, setEditingCatVal] = useState("");

  const load = useCallback(async () => {
    const [settingsRes, menuRes] = await Promise.all([fetch("/api/settings"), fetch("/api/menu?admin=1")]);
    const settingsData = await settingsRes.json();
    const menuData = await menuRes.json();
    const cats = parseCategories(settingsData.settings?.categories);
    setItems(menuData.items ?? []);
    setSections(resolveSections(cats, settingsData.settings?.homepage_layout));
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount
    load();
  }, [load]);

  function dirty() {
    setSaved(false);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categories: JSON.stringify(sections.map((s) => s.category)),
        homepage_layout: JSON.stringify(sections),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Save nahi hua. Dobara try karein.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function move(idx: number, dir: -1 | 1) {
    const to = idx + dir;
    if (to < 0 || to >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
    dirty();
  }
  function toggleShow(category: string) {
    setSections((p) => p.map((s) => (s.category === category ? { ...s, show: !s.show } : s)));
    dirty();
  }
  function addCategory() {
    const name = newCatName.trim();
    if (!name || sections.some((s) => s.category.toLowerCase() === name.toLowerCase())) return;
    setSections((p) => [...p, { category: name, show: true }]);
    setNewCatName("");
    dirty();
  }
  async function renameCategory() {
    const oldName = editingCat;
    const newName = editingCatVal.trim();
    setEditingCat(null);
    if (!oldName || !newName || newName === oldName) return;
    if (sections.some((s) => s.category.toLowerCase() === newName.toLowerCase())) {
      setError("Is naam ki category pehle se hai.");
      return;
    }
    // Items carry their category as text, so they must follow the rename or they'd vanish.
    const affected = items.filter((i) => i.category === oldName);
    const results = await Promise.all(
      affected.map((i) =>
        fetch(`/api/menu/${i.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: newName }),
        })
      )
    );
    if (results.some((r) => !r.ok)) {
      setError("Kuch items ki category update nahi hui. Page reload karke dobara try karein.");
      return;
    }
    setItems((p) => p.map((i) => (i.category === oldName ? { ...i, category: newName } : i)));
    setSections((p) => p.map((s) => (s.category === oldName ? { ...s, category: newName } : s)));
    dirty();
  }
  function deleteCategory(cat: string) {
    const count = items.filter((i) => i.category === cat).length;
    const msg = count
      ? `"${cat}" hatayein? Is ke ${count} items menu me rahenge lekin homepage par nahi dikhenge jab tak naye category me na dalein.`
      : `"${cat}" hatayein?`;
    if (!confirm(msg)) return;
    setSections((p) => p.filter((s) => s.category !== cat));
    dirty();
  }

  // Sold-out toggle applies immediately (it is a live menu change, not a layout change).
  async function toggleAvailable(item: MenuItem) {
    setBusyItem(item.id);
    const next = item.is_available === 1 ? 0 : 1;
    const res = await fetch(`/api/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: next }),
    });
    if (res.ok) setItems((p) => p.map((i) => (i.id === item.id ? { ...i, is_available: next } : i)));
    else setError("Item update nahi hua.");
    setBusyItem(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <PageHeader title="Homepage" />
        <div className="mt-6">
          <LoadingRows count={4} />
        </div>
      </div>
    );
  }

  const knownCats = new Set(sections.map((s) => s.category));
  const orphaned = items.filter((i) => !knownCats.has(i.category));

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <PageHeader
        title="Homepage"
        subtitle="Categories ka order aur show/hide. Items khud aate hain: naya item add karein to aa jata hai, sold-out ya delete karein to hat jata hai."
        action={
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-success)]">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </div>
        }
      />

      {error && <p className="rounded-xl bg-[#fbe9e9] px-4 py-2 text-sm text-[var(--color-error)]">{error}</p>}

      <div className="space-y-5">
        {sections.map((sec, idx) => {
          const catItems = items.filter((i) => i.category === sec.category);
          const live = catItems.filter((i) => i.is_available === 1).length;
          return (
            <div
              key={sec.category}
              className={`rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5 ${sec.show ? "" : "opacity-60"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="rounded p-0.5 text-[var(--color-text-tertiary)] disabled:opacity-20"
                  >
                    <ChevronDown className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === sections.length - 1}
                    aria-label="Move down"
                    className="rounded p-0.5 text-[var(--color-text-tertiary)] disabled:opacity-20"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  {editingCat === sec.category ? (
                    <input
                      autoFocus
                      className="w-full max-w-xs rounded-lg border border-[var(--color-accent)] px-2 py-1 text-sm outline-none"
                      value={editingCatVal}
                      onChange={(e) => setEditingCatVal(e.target.value)}
                      onBlur={renameCategory}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameCategory();
                        if (e.key === "Escape") setEditingCat(null);
                      }}
                    />
                  ) : (
                    <h3 className="truncate text-sm font-semibold">{sec.category}</h3>
                  )}
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {sec.show ? `${live} item homepage par live` : "Homepage se chhupa hua"}
                    {catItems.length - live > 0 && ` · ${catItems.length - live} sold out`}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCat(sec.category);
                    setEditingCatVal(sec.category);
                  }}
                  aria-label="Rename"
                  className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleShow(sec.category)}
                  aria-label={sec.show ? "Hide on homepage" : "Show on homepage"}
                  className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)]"
                >
                  {sec.show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => deleteCategory(sec.category)}
                  aria-label="Delete category"
                  className="rounded-lg p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Preview: exactly how the row looks on the homepage — swipe sideways */}
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                {catItems.length === 0 && (
                  <p className="py-4 text-xs text-[var(--color-text-tertiary)]">
                    Is category me abhi koi item nahi. Menu me item add karein.
                  </p>
                )}
                {catItems.map((item) => {
                  const isLive = item.is_available === 1;
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleAvailable(item)}
                      disabled={busyItem === item.id}
                      title={isLive ? "Tap: sold out karein (homepage se hat jayega)" : "Tap: wapas available karein"}
                      className={`relative w-32 shrink-0 overflow-hidden rounded-xl border text-left transition ${
                        isLive ? "border-[var(--color-cta)]/40 bg-white" : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-50"
                      }`}
                    >
                      <div className="aspect-[4/3] bg-[var(--color-accent-light)]">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={optimizeImageUrl(item.image_url, 300)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <UtensilsCrossed className="h-5 w-5 text-[var(--color-accent)]/40" />
                          </div>
                        )}
                      </div>
                      <span
                        className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white ${
                          isLive ? "bg-[var(--color-cta)]" : "bg-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {isLive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <EyeOff className="h-3 w-3" />}
                      </span>
                      <div className="p-2">
                        <p className="truncate text-[11px] font-semibold">{item.name}</p>
                        <p className="text-[11px] font-bold text-[var(--color-cta)]">{formatPKR(item.price_pkr)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {orphaned.length > 0 && (
        <p className="rounded-xl bg-[#faf3df] px-4 py-3 text-xs text-[var(--color-warning)]">
          {orphaned.length} item(s) aisi category me hain jo list me nahi ({[...new Set(orphaned.map((i) => i.category))].join(", ")}). Wo homepage par nahi dikhenge — neeche category add karein ya item ki category badlein.
        </p>
      )}

      <div className="flex gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <input
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          placeholder="Nayi category ka naam (jaise: Deals, BBQ, Karahi)"
          maxLength={40}
          className="h-11 flex-1 rounded-xl border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <Button onClick={addCategory} size="sm">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
