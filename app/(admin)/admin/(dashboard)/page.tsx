import { db } from "@/lib/db";
import { orders, reservations, menuItems } from "@/lib/db/schema";
import { gte, sql } from "drizzle-orm";
import { formatPKR } from "@/lib/utils";
import { Card } from "@/components/ui/misc";
import Link from "next/link";
import { AnalyticsCharts } from "@/components/features/admin/analytics-charts";

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

  const [pendingReservations] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reservations)
    .where(sql`${reservations.status} = 'pending'`);

  const [outOfStock] = await db
    .select({ count: sql<number>`count(*)` })
    .from(menuItems)
    .where(sql`${menuItems.isAvailable} = 0`);

  return {
    todayOrderCount: Number(todayOrders?.count ?? 0),
    todayRevenuePkr: Number(todayOrders?.revenue ?? 0),
    pendingOrderCount: Number(pendingOrders?.count ?? 0),
    pendingReservationCount: Number(pendingReservations?.count ?? 0),
    outOfStockCount: Number(outOfStock?.count ?? 0),
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Orders Today", value: stats.todayOrderCount, href: "/admin/orders", accent: false },
    { label: "Revenue Today", value: formatPKR(stats.todayRevenuePkr), href: "/admin/orders", accent: false },
    { label: "Needs Action", value: stats.pendingOrderCount, href: "/admin/orders", accent: stats.pendingOrderCount > 0 },
    { label: "Pending Reservations", value: stats.pendingReservationCount, href: "/admin/reservations", accent: stats.pendingReservationCount > 0 },
  ];

  return (
    <div>
      <h1 className="font-[var(--font-display)] text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Here&apos;s what&apos;s happening today.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className={c.accent ? "border-[var(--color-accent)]" : ""}>
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">{c.label}</p>
              <p className="mt-2 text-2xl font-bold">{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {stats.outOfStockCount > 0 && (
        <div className="mt-6 rounded-2xl border border-[var(--color-warning)] bg-[#faf3df] p-4 text-sm">
          <Link href="/admin/menu" className="font-medium text-[var(--color-text-primary)]">
            ⚠️ {stats.outOfStockCount} {stats.outOfStockCount === 1 ? "item is" : "items are"} marked unavailable — review your menu →
          </Link>
        </div>
      )}

      <AnalyticsCharts />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/admin/orders" className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-sm font-medium transition-colors hover:border-[var(--color-accent)]">
          🧾 Manage Orders
        </Link>
        <Link href="/admin/menu" className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-sm font-medium transition-colors hover:border-[var(--color-accent)]">
          🍔 Manage Menu
        </Link>
        <Link href="/admin/settings" className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-sm font-medium transition-colors hover:border-[var(--color-accent)]">
          ⚙️ Site Settings
        </Link>
      </div>
    </div>
  );
}
