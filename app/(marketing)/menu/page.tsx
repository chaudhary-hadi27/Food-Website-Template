"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryTabs } from "@/components/features/menu/category-tabs";
import { MenuCard } from "@/components/features/menu/menu-card";
import { Skeleton } from "@/components/ui/misc";
import { Section, PageHeader, EmptyState } from "@/components/ui/layout-primitives";
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
    <Section width="wide" padY="sm">
      <PageHeader title={t("our_menu")} subtitle="Fresh, made-to-order, and delivered across the city." />
      <input
        type="search"
        placeholder={t("search_dish")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full max-w-sm rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      />

      <div className="mt-2">
        <CategoryTabs categories={CATEGORIES} active={category} onChange={setCategory} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] h-full w-full" />)}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon="🔍" title="No dishes match your search" description="Try a different keyword or category." />
          </div>
        )}

        {!loading && filtered.map((item) => <MenuCard key={item.id} item={item} />)}
      </div>
    </Section>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <MenuContent />
    </Suspense>
  );
}
