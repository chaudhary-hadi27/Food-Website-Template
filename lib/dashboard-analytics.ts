import { db } from "@/lib/db";
import { orders, menuItems } from "@/lib/db/schema";
import { and, gte, lte, ne, sql } from "drizzle-orm";
import { BUSINESS_TZ, startOfZonedDay, endOfZonedDay, parseZonedDateStart, zonedParts } from "@/lib/time";

export type DashboardRange = "today" | "week" | "month" | "year" | "custom";
export type Granularity = "hour" | "day" | "month";

export interface DashboardAnalytics {
  range: DashboardRange;
  from: string;
  to: string;
  granularity: Granularity;
  orderCount: number;
  revenuePkr: number;
  needsActionCount: number;
  menuItemCount: number;
  outOfStockCount: number;
  revenueSeries: { bucket: string; revenue: number; orders: number }[];
  topItems: { name: string; quantity: number }[];
}

/** Resolve a named range (or explicit custom from/to) into concrete start/end Date objects. */
export function resolveRangeDates(
  range: DashboardRange,
  fromParam?: string | null,
  toParam?: string | null
): { from: Date; to: Date } {
  // Day boundaries are the restaurant's days (Pakistan time), NOT the server's clock —
  // on Vercel the server runs in UTC and "today" would otherwise start at 5 AM.
  const now = new Date();
  let from = startOfZonedDay(now);
  let to = endOfZonedDay(now);

  if (range === "custom") {
    const customFrom = fromParam ? parseZonedDateStart(fromParam) : null;
    const customTo = toParam ? parseZonedDateStart(toParam) : null;
    if (customFrom) from = customFrom;
    if (customTo) to = endOfZonedDay(customTo);
    if (from.getTime() > to.getTime()) [from, to] = [startOfZonedDay(to), endOfZonedDay(from)];
    return { from, to };
  }
  if (range === "week") from = startOfZonedDay(now, -6);
  else if (range === "month") from = startOfZonedDay(now, -29);
  else if (range === "year") from = startOfZonedDay(now, -364);
  // "today" — from/to already bracket the current day

  return { from, to };
}

/** Pick a sensible bucket size for the revenue-over-time chart based on the span selected. */
function getGranularity(from: Date, to: Date): Granularity {
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (days <= 1.5) return "hour";
  if (days <= 62) return "day";
  return "month";
}

function bucketKey(date: Date, granularity: Granularity): string {
  const p = zonedParts(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (granularity === "hour") return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:00`;
  if (granularity === "month") return `${p.year}-${pad(p.month)}`;
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export async function getDashboardAnalytics(
  range: DashboardRange,
  fromParam?: string | null,
  toParam?: string | null
): Promise<DashboardAnalytics> {
  const { from, to } = resolveRangeDates(range, fromParam, toParam);
  const granularity = getGranularity(from, to);

  // All the counting/summing happens inside Postgres, so a "year" view no longer downloads
  // every order (with its items, addresses and screenshots) into memory. Buckets are UTC,
  // exactly as before.
  const inRange = and(gte(orders.createdAt, from), lte(orders.createdAt, to));
  const notCancelled = and(inRange, ne(orders.status, "cancelled"));

  // Internal constants (never user input) — safe to inline.
  const unit = granularity === "hour" ? "hour" : granularity === "month" ? "month" : "day";
  const fmt = granularity === "hour" ? 'YYYY-MM-DD"T"HH24:00' : granularity === "month" ? "YYYY-MM" : "YYYY-MM-DD";
  // created_at is stored as UTC; shift it to the restaurant's wall clock before bucketing.
  const localCreated = sql`(${orders.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE '${sql.raw(BUSINESS_TZ)}')`;
  const bucketExpr = sql<string>`to_char(date_trunc('${sql.raw(unit)}', ${localCreated}), '${sql.raw(fmt)}')`;

  const [totalsRows, seriesRows, topItemRows, menuRows] = await Promise.all([
    db
      .select({
        orderCount: sql<number>`count(*)`,
        needsAction: sql<number>`count(*) filter (where ${orders.status} in ('pending', 'preparing', 'ready'))`,
        revenue: sql<number>`coalesce(sum(${orders.totalPkr}) filter (where ${orders.status} <> 'cancelled'), 0)`,
      })
      .from(orders)
      .where(inRange),
    db
      .select({
        bucket: bucketExpr,
        revenue: sql<number>`coalesce(sum(${orders.totalPkr}), 0)`,
        orders: sql<number>`count(*)`,
      })
      .from(orders)
      .where(notCancelled)
      .groupBy(sql`1`),
    db.execute(sql`
      select item->>'name' as name, sum((item->>'quantity')::int) as quantity
      from ${orders}, jsonb_array_elements(${orders.items}) as item
      where ${orders.createdAt} >= ${from.toISOString()}::timestamp
        and ${orders.createdAt} <= ${to.toISOString()}::timestamp
        and ${orders.status} <> 'cancelled'
      group by 1
      order by quantity desc, name asc
      limit 6
    `),
    db
      .select({
        total: sql<number>`count(*)`,
        outOfStock: sql<number>`count(*) filter (where ${menuItems.isAvailable} = 0)`,
      })
      .from(menuItems),
  ]);

  // Seed every bucket with zero so gaps in the chart read as "no sales", not missing data.
  const buckets: Record<string, { bucket: string; revenue: number; orders: number }> = {};
  let cursor = new Date(from);
  let guard = 0;
  while (cursor <= to && guard < 400) {
    const key = bucketKey(cursor, granularity);
    buckets[key] = { bucket: key, revenue: 0, orders: 0 };
    const p = zonedParts(cursor);
    if (granularity === "hour") cursor = new Date(cursor.getTime() + 3_600_000);
    else if (granularity === "month") cursor = startOfZonedDay(new Date(Date.UTC(p.year, p.month, 1, 12)), 0);
    else cursor = startOfZonedDay(cursor, 1);
    guard++;
  }
  for (const r of seriesRows) {
    // The window is in server-local time but buckets are UTC, so the last UTC day/month can
    // be missing from the seeded keys. Always keep what the database returned.
    const b = buckets[r.bucket] ?? (buckets[r.bucket] = { bucket: r.bucket, revenue: 0, orders: 0 });
    b.revenue = Number(r.revenue);
    b.orders = Number(r.orders);
  }

  const topItems = (topItemRows as unknown as { name: string; quantity: string | number }[]).map((r) => ({
    name: r.name,
    quantity: Number(r.quantity),
  }));

  const orderCount = Number(totalsRows[0]?.orderCount ?? 0);
  const revenuePkr = Number(totalsRows[0]?.revenue ?? 0);
  const needsActionCount = Number(totalsRows[0]?.needsAction ?? 0);
  const menuCount = menuRows[0];
  const outOfStock = menuRows[0];

  return {
    range,
    from: from.toISOString(),
    to: to.toISOString(),
    granularity,
    orderCount,
    revenuePkr,
    needsActionCount,
    menuItemCount: Number(menuCount?.total ?? 0),
    outOfStockCount: Number(outOfStock?.outOfStock ?? 0),
    revenueSeries: Object.values(buckets).sort((a, b) => a.bucket.localeCompare(b.bucket)),
    topItems,
  };
}
