"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatPKR } from "@/lib/utils";

interface RevenueDay {
  date: string;
  revenue: number;
  orders: number;
}
interface TopItem {
  name: string;
  quantity: number;
}

export function AnalyticsCharts() {
  const [revenueByDay, setRevenueByDay] = useState<RevenueDay[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => {
        setRevenueByDay(data.revenueByDay ?? []);
        setTopItems(data.topItems ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="mt-8 h-64 animate-pulse rounded-2xl bg-white" />;
  }

  const chartData = revenueByDay.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-PK", { weekday: "short" }),
  }));

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <h3 className="text-sm font-semibold">Revenue — Last 7 Days</h3>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} width={40} />
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
        <h3 className="text-sm font-semibold">Top Sellers — Last 7 Days</h3>
        {topItems.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">No sales yet this week.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-xs font-semibold text-[var(--color-accent-dark)]">
                  {i + 1}
                </span>
                <p className="flex-1 truncate text-sm">{item.name}</p>
                <p className="text-sm font-semibold">{item.quantity}x</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
