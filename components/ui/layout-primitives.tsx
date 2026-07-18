import { cn } from "@/lib/utils";

/**
 * Section — the single source of truth for horizontal page padding + max-width.
 * Every top-level page section should use this instead of repeating
 * "mx-auto max-w-7xl px-4 sm:px-6" inline everywhere.
 */
export function Section({
  children,
  className,
  width = "default",
  padY = "default",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "narrow" | "default" | "wide";
  padY?: "none" | "sm" | "default" | "lg";
}) {
  const widths = {
    narrow: "max-w-2xl",
    default: "max-w-4xl",
    wide: "max-w-7xl",
  };
  const paddings = {
    none: "",
    sm: "py-6 sm:py-8",
    default: "py-10 sm:py-14",
    lg: "py-16 sm:py-24",
  };
  return (
    <div className={cn("mx-auto px-4 sm:px-6", widths[width], paddings[padY], className)}>
      {children}
    </div>
  );
}

/**
 * PageHeader — title + subtitle + optional right-aligned action, used on every
 * admin page and most marketing pages so headings stop being ad-hoc per file.
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * EmptyState — consistent "nothing here yet" pattern instead of a bare <p> per page.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  icon?: string; // kept for API compat but ignored
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-light)]">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-[var(--color-accent)]/40"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 11h18M3 11a9 9 0 0 1 18 0M3 11l2 9h14l2-9M12 11V3M12 3l-3 4M12 3l3 4" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
      {description && <p className="mt-1.5 max-w-xs text-sm text-[var(--color-text-secondary)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}


/**
 * StatCard — the single pattern for dashboard metric tiles (used on the admin
 * home page). Optional accent border for "needs attention" states.
 */
export function StatCard({
  label,
  value,
  href,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  accent?: boolean;
}) {
  const content = (
    <div
      className={cn(
        "rounded-2xl border bg-white p-6 transition-shadow hover:shadow-sm",
        accent ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
      )}
    >
      <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}

/**
 * LoadingRows — consistent skeleton-list pattern for admin pages while data loads,
 * replacing ad-hoc "Loading..." text.
 */
export function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--color-surface)]" />
      ))}
    </div>
  );
}
