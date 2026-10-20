"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatPKR, formatPKRCompact, formatCompactNumber } from "@/lib/utils";
import { PackageX } from "@/components/ui/icons";

type Range = "today" | "week" | "month" | "year" | "custom";

export interface AnalyticsData {
  range: Range;
  from: string;
  to: string;
  granularity: "hour" | "day" | "month";
  orderCount: number;
  revenuePkr: number;
  needsActionCount: number;
  menuItemCount: number;
  outOfStockCount: number;
  revenueSeries: { bucket: string; revenue: number; orders: number }[];
  topItems: { name: string; quantity: number }[];
}

const RANGE_OPTIONS: { key: Range; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

// Reuses the site's existing theme colors so the pie chart matches the rest of the admin,
// instead of introducing an unrelated new palette.
const PIE_COLORS = ["#D9480F", "#1E7B3C", "#B7791F", "#6B5548", "#B42318", "#9A8678"];

function formatBucketLabel(bucket: string, granularity: AnalyticsData["granularity"]) {
  if (granularity === "hour") {
    return new Date(bucket).toLocaleTimeString("en-PK", { hour: "numeric", hour12: true });
  }
  if (granularity === "month") {
    const [y, m] = bucket.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-PK", { month: "short", year: "2-digit" });
  }
  return new Date(bucket).toLocaleDateString("en-PK", { weekday: "short", day: "numeric" });
}

export function DashboardOverview({ initialData }: { initialData: AnalyticsData }) {
  const [range, setRange] = useState<Range>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (r: Range, from?: string, to?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range: r });
      if (r === "custom" && from && to) {
        params.set("from", from);
        params.set("to", to);
      }
      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleRangeChange(r: Range) {
    setRange(r);
    if (r === "custom") {
      setShowCustomPanel(true);
      return;
    }
    setShowCustomPanel(false);
    load(r);
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) return;
    load("custom", customFrom, customTo);
    setShowCustomPanel(false);
  }

  const chartData = useMemo(
    () => data.revenueSeries.map((d) => ({ ...d, label: formatBucketLabel(d.bucket, data.granularity) })),
    [data.revenueSeries, data.granularity]
  );

  const cards = [
    {
      label: "Orders",
      compact: formatCompactNumber(data.orderCount),
      full: String(data.orderCount),
      href: "/admin/orders",
    },
    {
      label: "Revenue",
      compact: formatPKRCompact(data.revenuePkr),
      full: formatPKR(data.revenuePkr),
      href: "/admin/orders",
    },
    {
      label: "Needs Action",
      compact: formatCompactNumber(data.needsActionCount),
      full: String(data.needsActionCount),
      href: "/admin/orders",
      accent: data.needsActionCount > 0,
    },
    {
      label: "Menu Items",
      compact: formatCompactNumber(data.menuItemCount),
      full: String(data.menuItemCount),
      href: "/admin/menu",
    },
  ];

  return (
    <div>
      {/* Range selector */}
      <div className="relative flex flex-wrap items-center gap-2">
        <div
          className="flex overflow-x-auto gap-1 rounded-xl border border-[var(--color-border)] bg-white p-1"
          style={{ scrollbarWidth: "none" }}
        >
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleRangeChange(opt.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === opt.key
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent-dark)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {range === "custom" && data.range === "custom" && !showCustomPanel && (
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {new Date(data.from).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} –{" "}
            {new Date(data.to).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
          </span>
        )}

        {showCustomPanel && (
          <div className="absolute left-0 top-full z-20 mt-2 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-lg">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[var(--color-text-secondary)]">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                max={customTo || new Date().toISOString().slice(0, 10)}
                className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[var(--color-text-secondary)]">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom || undefined}
                max={new Date().toISOString().slice(0, 10)}
                className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <button
              onClick={applyCustomRange}
              disabled={!customFrom || !customTo}
              className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-accent-dark)] disabled:opacity-40"
            >
              Apply
            </button>
            <button
              onClick={() => setShowCustomPanel(false)}
              className="text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Stat cards — a single row even on the smallest phones; values use compact notation
          (e.g. "PKR 45K") with the exact figure available on hover/long-press via title=,
          so a big number can never push the card out of shape. */}
      <div className={`mt-4 grid grid-cols-4 gap-2 transition-opacity sm:gap-4 ${loading ? "opacity-60" : ""}`}>
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            title={c.full}
            className={`min-w-0 rounded-xl border bg-white p-2.5 transition-shadow hover:shadow-sm sm:rounded-2xl sm:p-6 ${
              c.accent ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
            }`}
          >
            <p className="truncate text-[10px] font-medium text-[var(--color-text-secondary)] sm:text-xs">
              {c.label}
            </p>
            <p className="mt-1 truncate text-[15px] font-bold text-[var(--color-text-primary)] sm:mt-2 sm:text-2xl">
              {c.compact}
            </p>
          </Link>
        ))}
      </div>

      {data.outOfStockCount > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[var(--color-warning)] bg-amber-50 p-4 text-sm">
          <PackageX className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
          <Link href="/admin/menu" className="font-medium text-[var(--color-text-primary)]">
            {data.outOfStockCount} {data.outOfStockCount === 1 ? "item is" : "items are"} marked unavailable — review
            your menu →
          </Link>
        </div>
      )}

      {/* Charts */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <h3 className="text-sm font-semibold">Revenue Over Time</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v) => (v >= 1_000_000 ? `${+(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                />
                <Tooltip
                  formatter={(value) => [formatPKR(Number(value)), "Revenue"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <h3 className="text-sm font-semibold">Top Sellers</h3>
          {data.topItems.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">No sales in this period.</p>
          ) : (
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.topItems}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {data.topItems.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}x`, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
