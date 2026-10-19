"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingRows } from "@/components/ui/layout-primitives";
import {
  GripVertical,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  UtensilsCrossed,
  Pencil,
  XCircle,
  FolderOpen,
  Check,
} from "@/components/ui/icons";
import type { MenuItem } from "@/types";

interface HomepageSection {
  id: string;
  category: string;
  limit: number;
  show: boolean;
  productIds: number[];
}

function generateId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function HomepageDesignerPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Category manager state
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatVal, setEditingCatVal] = useState("");

  // Product Selection Modal state
  const [activeSecIdForModal, setActiveSecIdForModal] = useState<string | null>(null);
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>([]);

  // Drag state for sections
  const dragSectionIdx = useRef<number | null>(null);

  // Drag state for products within a section
  const dragProductInfo = useRef<{ sectionId: string; fromIdx: number } | null>(null);

  const load = useCallback(async () => {
    const [settingsRes, menuRes] = await Promise.all([
      fetch("/api/settings"),
      fetch("/api/menu?admin=1"),
    ]);
    const settingsData = await settingsRes.json();
    const menuData = await menuRes.json();
    const items: MenuItem[] = menuData.items ?? [];

    const rawCats = settingsData.settings?.categories;
    const cats: string[] = rawCats
      ? JSON.parse(rawCats)
      : ["Gourmet Burgers", "Premium Sides", "Artisan Drinks", "Desserts"];

    const rawLayout = settingsData.settings?.homepage_layout;
    let layout: HomepageSection[] = cats.map((cat: string, i: number) => ({
      id: `default-${i}`,
      category: cat,
      limit: 4,
      show: true,
      productIds: [],
    }));
    if (rawLayout) {
      try {
        layout = JSON.parse(rawLayout);
      } catch {
        /* keep default */
      }
    }

    // Pre-populate empty productIds with the fallback items so the designer
    // shows what is already being shown on the homepage.
    layout = layout.map((sec) => {
      if (sec.productIds && sec.productIds.length > 0) return sec;
      const fallback = items
        .filter((it) => it.category === sec.category)
        .sort((a, b) => {
          if (b.is_bestseller !== a.is_bestseller) return b.is_bestseller - a.is_bestseller;
          return b.rating - a.rating;
        })
        .slice(0, sec.limit)
        .map((it) => it.id);
      return { ...sec, productIds: fallback };
    });

    setCategories(cats);
    setAllItems(items);
    setSections(layout);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount
    load();
  }, [load]);

  // ── Save ────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categories: JSON.stringify(categories),
        homepage_layout: JSON.stringify(sections),
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // ── Section drag & drop ─────────────────────────────────────────
  function onSectionDragStart(idx: number) {
    dragSectionIdx.current = idx;
  }
  function onSectionDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragSectionIdx.current === null || dragSectionIdx.current === idx) return;
    const next = [...sections];
    const [moved] = next.splice(dragSectionIdx.current, 1);
    next.splice(idx, 0, moved);
    dragSectionIdx.current = idx;
    setSections(next);
  }
  function onSectionDragEnd() {
    dragSectionIdx.current = null;
  }

  // ── Product drag & drop within section ─────────────────────────
  function onProductDragStart(sectionId: string, fromIdx: number) {
    dragProductInfo.current = { sectionId, fromIdx };
  }
  function onProductDragOver(e: React.DragEvent, sectionId: string, toIdx: number) {
    e.preventDefault();
    const info = dragProductInfo.current;
    if (!info || info.sectionId !== sectionId || info.fromIdx === toIdx) return;
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const ids = [...sec.productIds];
        const [moved] = ids.splice(info.fromIdx, 1);
        ids.splice(toIdx, 0, moved);
        return { ...sec, productIds: ids };
      })
    );
    dragProductInfo.current = { sectionId, fromIdx: toIdx };
  }
  function onProductDragEnd() {
    dragProductInfo.current = null;
  }

  // ── Section helpers ─────────────────────────────────────────────
  function toggleSectionVisibility(id: string) {
    setSections((p) => p.map((s) => (s.id === id ? { ...s, show: !s.show } : s)));
    setSaved(false);
  }
  function updateLimit(id: string, val: number) {
    setSections((p) => p.map((s) => (s.id === id ? { ...s, limit: Math.max(1, Math.min(24, val)) } : s)));
    setSaved(false);
  }
  function removeSection(id: string) {
    setSections((p) => p.filter((s) => s.id !== id));
    setSaved(false);
  }
  function addSection(cat: string) {
    if (sections.some((s) => s.category === cat)) return;
    const fallback = allItems
      .filter((it) => it.category === cat)
      .sort((a, b) => {
        if (b.is_bestseller !== a.is_bestseller) return b.is_bestseller - a.is_bestseller;
        return b.rating - a.rating;
      })
      .slice(0, 4)
      .map((it) => it.id);
    setSections((p) => [...p, { id: generateId(), category: cat, limit: 4, show: true, productIds: fallback }]);
    setSaved(false);
  }

  // ── Category helpers ────────────────────────────────────────────
  function addCategory() {
    const name = newCatName.trim();
    if (!name || categories.includes(name)) return;
    setCategories((p) => [...p, name]);
    setNewCatName("");
    setSaved(false);
  }
  function renameCategory() {
    const oldName = editingCat!;
    const newName = editingCatVal.trim();
    if (!newName || newName === oldName) {
      setEditingCat(null);
      return;
    }
    setCategories((p) => p.map((c) => (c === oldName ? newName : c)));
    setSections((p) => p.map((s) => (s.category === oldName ? { ...s, category: newName } : s)));
    setEditingCat(null);
    setSaved(false);
  }
  function deleteCategory(cat: string) {
    if (!confirm(`Delete category "${cat}"? Menu items in this category will keep their category label.`)) return;
    setCategories((p) => p.filter((c) => c !== cat));
    setSections((p) => p.filter((s) => s.category !== cat));
    setSaved(false);
  }

  // Open item selection modal
  const openSelectionModal = (section: HomepageSection) => {
    setActiveSecIdForModal(section.id);
    setTempSelectedIds([...section.productIds]);
  };

  // Toggle item in temporary modal array
  const toggleTempItem = (itemId: number) => {
    setTempSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Save selection from modal
  const applyModalSelection = () => {
    if (activeSecIdForModal) {
      setSections((prev) =>
        prev.map((sec) =>
          sec.id === activeSecIdForModal ? { ...sec, productIds: tempSelectedIds } : sec
        )
      );
      setActiveSecIdForModal(null);
      setSaved(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <PageHeader title="Homepage Designer" />
        <div className="mt-6">
          <LoadingRows count={4} />
        </div>
      </div>
    );
  }

  const activeSection = sections.find((s) => s.id === activeSecIdForModal);
  const activeSectionItems = activeSection
    ? allItems.filter((item) => item.category === activeSection.category)
    : [];

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <PageHeader
        title="Homepage Designer"
        subtitle="Manage categories, add homepage sections, and choose specific items to show."
        action={
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-[var(--color-success)] font-medium">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
            <Button onClick={handleSave} loading={saving}>
              Save Layout
            </Button>
          </div>
        }
      />

      {/* ── Category Manager ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Category Manager</h2>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
          Create, edit, or delete categories. Changes will update the public website immediately.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5"
            >
              {editingCat === cat ? (
                <input
                  autoFocus
                  className="w-32 rounded-lg border border-[var(--color-accent)] px-2 py-0.5 text-xs outline-none"
                  value={editingCatVal}
                  onChange={(e) => setEditingCatVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameCategory();
                    if (e.key === "Escape") setEditingCat(null);
                  }}
                />
              ) : (
                <span className="text-xs font-medium">{cat}</span>
              )}
              {editingCat === cat ? (
                <button onClick={renameCategory} className="ml-1 text-[var(--color-success)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingCat(cat);
                    setEditingCatVal(cat);
                  }}
                  className="ml-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => deleteCategory(cat)}
                className="ml-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="h-9 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm outline-none focus:border-[var(--color-accent)]"
            placeholder="Create custom category..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <Button size="sm" onClick={addCategory}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {/* ── Add section from category ─────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Add Section to Homepage</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories
            .filter((cat) => !sections.some((s) => s.category === cat))
            .map((cat) => (
              <button
                key={cat}
                onClick={() => addSection(cat)}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors bg-white hover:bg-[var(--color-accent-light)]"
              >
                <Plus className="h-3.5 w-3.5" /> {cat}
              </button>
            ))}
          {categories.every((cat) => sections.some((s) => s.category === cat)) && (
            <p className="text-xs text-[var(--color-text-tertiary)]">All categories are already added to your homepage.</p>
          )}
        </div>
      </div>

      {/* ── Section list (drag & drop) ────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
          Homepage Layout (Drag sections to reorder)
        </h2>

        {sections.map((section, sIdx) => {
          const catItems = allItems.filter((item) => item.category === section.category);
          // Items selected for this section
          const selectedItems = section.productIds
            .map((id) => allItems.find((it) => it.id === id))
            .filter(Boolean) as MenuItem[];

          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => onSectionDragStart(sIdx)}
              onDragOver={(e) => onSectionDragOver(e, sIdx)}
              onDragEnd={onSectionDragEnd}
              className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden"
            >
              {/* Section header */}
              <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60">
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[var(--color-text-tertiary)]" />
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-light)]">
                  <UtensilsCrossed className="h-4 w-4 text-[var(--color-accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {section.category}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {selectedItems.length} custom items selected · Limit: {section.limit}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Limit control */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-2 py-1 bg-white">
                    <button
                      onClick={() => updateLimit(section.id, section.limit - 1)}
                      className="h-5 w-5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] font-bold"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-xs font-semibold">{section.limit}</span>
                    <button
                      onClick={() => updateLimit(section.id, section.limit + 1)}
                      className="h-5 w-5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleSectionVisibility(section.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors bg-white ${
                      section.show
                        ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                        : "border-[var(--color-border)] text-[var(--color-text-tertiary)]"
                    }`}
                    title={section.show ? "Hide section" : "Show section"}
                  >
                    {section.show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => removeSection(section.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-tertiary)] transition-colors hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Selected Items List */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Items Selected For Display
                  </p>
                  <button
                    onClick={() => openSelectionModal(section)}
                    className="flex items-center gap-1 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-light)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-accent)] transition-all hover:bg-[var(--color-accent)] hover:text-white"
                  >
                    <FolderOpen className="h-3.5 w-3.5" /> Select Dishes
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] px-4 py-6 text-xs text-[var(--color-text-tertiary)] justify-center">
                    <AlertTriangle className="h-4 w-4" />
                    No custom items selected. Click &ldquo;Select Dishes&rdquo; to choose items.
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mb-2">
                      💡 Drag products below to change their display order on the homepage.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map((item, pIdx) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={() => onProductDragStart(section.id, pIdx)}
                          onDragOver={(e) => onProductDragOver(e, section.id, pIdx)}
                          onDragEnd={onProductDragEnd}
                          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white pl-2.5 pr-3 py-2 cursor-grab shadow-sm transition-colors hover:border-[var(--color-accent)]"
                        >
                          <GripVertical className="h-3.5 w-3.5 text-[var(--color-text-tertiary)] shrink-0" />
                          {item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-6 w-6 rounded-lg object-cover bg-[var(--color-surface)] shrink-0"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-lg bg-[var(--color-surface)] flex items-center justify-center shrink-0">
                              <UtensilsCrossed className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                            </div>
                          )}
                          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Layout Card */}
      <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <p className="text-xs text-[var(--color-text-secondary)]">
          Changes update the restaurant homepage instantly once saved.
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-success)] font-medium">
              <CheckCircle2 className="h-4 w-4" /> Saved!
            </span>
          )}
          <Button onClick={handleSave} loading={saving}>
            Save Layout
          </Button>
        </div>
      </div>

      {/* ── Select Dishes Modal ────────────────────────────────────── */}
      {activeSecIdForModal && activeSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setActiveSecIdForModal(null)} />
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div>
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
                  Select Items for {activeSection.category}
                </h4>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                  Check items to show them. Unchecked items will be hidden from the homepage.
                </p>
              </div>
              <button
                onClick={() => setActiveSecIdForModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]"
              >
                <XCircle className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeSectionItems.length === 0 ? (
                <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6">
                  No items belong to this category. Create menu items in this category first.
                </p>
              ) : (
                activeSectionItems.map((item) => {
                  const isChecked = tempSelectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleTempItem(item.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        isChecked
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]/40"
                          : "border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isChecked ? "bg-[var(--color-accent)] border-transparent text-white" : "border-[var(--color-border)] bg-white"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover bg-white shrink-0 border border-[var(--color-border)]"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-[var(--color-surface)] flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                          <UtensilsCrossed className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                          {formatPKR(item.price_pkr)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="bg-[var(--color-surface)] px-5 py-4 border-t border-[var(--color-border)] flex justify-end gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setActiveSecIdForModal(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={applyModalSelection}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
