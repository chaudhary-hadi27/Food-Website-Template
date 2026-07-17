"use client";

import { cn } from "@/lib/utils";

export function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: readonly string[];
  active: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="sticky top-[73px] z-30 -mx-4 border-b border-[var(--color-border)] bg-white/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto">
        <button
          onClick={() => onChange("All")}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            active === "All"
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active === cat
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
