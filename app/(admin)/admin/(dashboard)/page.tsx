import { db } from "@/lib/db";
import { orders, menuItems } from "@/lib/db/schema";
import { gte, sql } from "drizzle-orm";
import { formatPKR } from "@/lib/utils";
import Link from "next/link";
import { AnalyticsCharts } from "@/components/features/admin/analytics-charts";
import { PageHeader, StatCard } from "@/components/ui/layout-primitives";
import { ClipboardList, UtensilsCrossed, Settings2, Layers, PackageX } from "@/components/ui/icons";

async function getStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayOrders] = await db
    .select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${orders.totalPkr}), 0)` })
    .from(orders)
    .where(gte(orders.createdAt, startOfToday));

  const [pendingOrders] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(sql`${orders.status} in ('pending', 'preparing')`);

  const [outOfStock] = await db
    .select({ count: sql<number>`count(*)` })
    .from(menuItems)
    .where(sql`${menuItems.isAvailable} = 0`);

  const [totalItems] = await db
    .select({ count: sql<number>`count(*)` })
    .from(menuItems);

  return {
    todayOrderCount: Number(todayOrders?.count ?? 0),
    todayRevenuePkr: Number(todayOrders?.revenue ?? 0),
    pendingOrderCount: Number(pendingOrders?.count ?? 0),
    outOfStockCount: Number(outOfStock?.count ?? 0),
    totalItemsCount: Number(totalItems?.count ?? 0),
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Orders Today",   value: stats.todayOrderCount,         href: "/admin/orders", accent: false },
    { label: "Revenue Today",  value: formatPKR(stats.todayRevenuePkr), href: "/admin/orders", accent: false },
    { label: "Needs Action",   value: stats.pendingOrderCount,       href: "/admin/orders", accent: stats.pendingOrderCount > 0 },
    { label: "Menu Items",     value: stats.totalItemsCount,          href: "/admin/menu",   accent: false },
  ];

  const quickLinks = [
    { href: "/admin/orders",            Icon: ClipboardList,  label: "Manage Orders" },
    { href: "/admin/menu",              Icon: UtensilsCrossed, label: "Manage Menu" },
    { href: "/admin/settings/homepage", Icon: Layers,          label: "Homepage Designer" },
    { href: "/admin/settings",          Icon: Settings2,       label: "Site Settings" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Here's what's happening today." />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} href={c.href} accent={c.accent} />
        ))}
      </div>

      {stats.outOfStockCount > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[var(--color-warning)] bg-amber-50 p-4 text-sm">
          <PackageX className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
          <Link href="/admin/menu" className="font-medium text-[var(--color-text-primary)]">
            {stats.outOfStockCount}{" "}
            {stats.outOfStockCount === 1 ? "item is" : "items are"} marked unavailable — review your menu →
          </Link>
        </div>
      )}

      <AnalyticsCharts />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-5 text-sm font-medium transition-all hover:border-[var(--color-accent)] hover:shadow-sm"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-white">
              <link.Icon className="h-4 w-4" />
            </div>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
