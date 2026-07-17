"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryTabs } from "@/components/features/menu/category-tabs";
import { MenuCard } from "@/components/features/menu/menu-card";
import { Skeleton } from "@/components/ui/misc";
import { CATEGORIES } from "@/lib/constants";
import type { MenuItem } from "@/types";
import { useLanguage } from "@/lib/i18n";

function MenuContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, category, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-3xl font-bold">{t("our_menu")}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Fresh, made-to-order, and delivered across the city.
        </p>
        <input
          type="search"
          placeholder={t("search_dish")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-4 w-full max-w-sm rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
      </div>

      <CategoryTabs categories={CATEGORIES} active={category} onChange={setCategory} />

      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] h-full w-full" />)}

        {!loading && filtered.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-[var(--color-text-secondary)]">
            No dishes match your search.
          </p>
        )}

        {!loading && filtered.map((item) => <MenuCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <MenuContent />
    </Suspense>
  );
}
