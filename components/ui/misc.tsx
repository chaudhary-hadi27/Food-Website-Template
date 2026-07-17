import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: "neutral" | "accent" | "gold" | "success" | "warning" | "error";
  className?: string;
}) {
  const variants: Record<string, string> = {
    neutral: "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
    accent: "bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]",
    gold: "bg-[#faf3df] text-[var(--color-gold)]",
    success: "bg-[#e8f5ea] text-[var(--color-success)]",
    warning: "bg-[#faf3df] text-[var(--color-warning)]",
    error: "bg-[#fbe9e9] text-[var(--color-error)]",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-[var(--color-surface)]", className)} />;
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-gold)]">
      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
        <path d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L10 14.9 4.4 18l1.4-6.2L1 7.5l6.4-.6L10 1z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  );
}
