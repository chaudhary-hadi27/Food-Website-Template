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
  const allTabs = ["All", ...categories];

  return (
    <div className="sticky top-[73px] z-30 -mx-4 border-b border-[var(--color-border)] bg-white/90 px-4 py-2.5 backdrop-blur-md transition-all duration-300 sm:-mx-6 sm:px-6">
      <div className="scrollbar-hide flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {allTabs.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={cn(
                "relative min-h-[40px] shrink-0 rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition-colors duration-200",
                isActive
                  ? "text-white"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {isActive && <span className="absolute inset-0 z-0 rounded-full bg-[var(--color-accent)]" />}
              <span className="relative z-10">{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
