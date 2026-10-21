import { cn } from "@/lib/utils";

/**
 * DataRow — the single layout pattern for every admin list item (orders,
 * menu items, coupons, orders). Before this, each admin page had
 * its own hand-rolled flex layout with slightly different spacing/borders —
 * this makes every list in the dashboard feel like the same product.
 *
 * Slots:
 *  - leading: optional image/icon/avatar on the left
 *  - primary: main title (bold)
 *  - secondary: subtitle line(s) below the title
 *  - meta: badges/tags, rendered inline after secondary on desktop, wraps on mobile
 *  - trailing: right-aligned actions (buttons, selects, price)
 */
export function DataRow({
  leading,
  primary,
  secondary,
  meta,
  trailing,
  className,
}: {
  leading?: React.ReactNode;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{primary}</p>
          {secondary && <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{secondary}</p>}
          {meta && <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{meta}</div>}
        </div>
      </div>
      {trailing && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{trailing}</div>}
    </div>
  );
}

export function DataRowThumb({ src, alt }: { src?: string; alt: string; emoji?: string }) {
  return (
    <div className="h-12 w-12 overflow-hidden rounded-xl bg-[var(--color-accent-light)]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-[var(--color-accent)]/30"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 11h18M3 11a9 9 0 0 1 18 0M3 11l2 9h14l2-9M12 11V3M12 3l-3 4M12 3l3 4" />
          </svg>
        </div>
      )}
    </div>
  );
}
