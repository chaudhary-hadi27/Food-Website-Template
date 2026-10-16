import { db } from "@/lib/db";
import { orders, menuItems } from "@/lib/db/schema";
import { and, gte, lte, sql } from "drizzle-orm";
import type { OrderItem } from "@/types";

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
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (range === "custom") {
    const customFrom = fromParam ? new Date(fromParam) : from;
    customFrom.setHours(0, 0, 0, 0);
    const customTo = toParam ? new Date(toParam) : to;
    customTo.setHours(23, 59, 59, 999);
    return { from: customFrom, to: customTo };
  }
  if (range === "week") from.setDate(from.getDate() - 6);
  else if (range === "month") from.setDate(from.getDate() - 29);
  else if (range === "year") from.setDate(from.getDate() - 364);
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
  if (granularity === "hour") return `${date.toISOString().slice(0, 13)}:00`;
  if (granularity === "month") return date.toISOString().slice(0, 7);
  return date.toISOString().slice(0, 10);
}

export async function getDashboardAnalytics(
  range: DashboardRange,
  fromParam?: string | null,
  toParam?: string | null
): Promise<DashboardAnalytics> {
  const { from, to } = resolveRangeDates(range, fromParam, toParam);
  const granularity = getGranularity(from, to);

  const rows = await db
    .select()
    .from(orders)
    .where(and(gte(orders.createdAt, from), lte(orders.createdAt, to)));

  // Seed every bucket with zero so gaps in the chart read as "no sales", not missing data.
  const buckets: Record<string, { bucket: string; revenue: number; orders: number }> = {};
  const cursor = new Date(from);
  let guard = 0;
  while (cursor <= to && guard < 400) {
    const key = bucketKey(cursor, granularity);
    buckets[key] = { bucket: key, revenue: 0, orders: 0 };
    if (granularity === "hour") cursor.setHours(cursor.getHours() + 1);
    else if (granularity === "month") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
    guard++;
  }

  let orderCount = 0;
  let revenuePkr = 0;
  let needsActionCount = 0;
  const itemCounts = new Map<string, number>();

  for (const row of rows) {
    orderCount += 1;
    if (row.status === "pending" || row.status === "preparing" || row.status === "ready") {
      needsActionCount += 1;
    }
    if (row.status === "cancelled") continue;

    revenuePkr += row.totalPkr;
    const key = bucketKey(new Date(row.createdAt), granularity);
    if (buckets[key]) {
      buckets[key].revenue += row.totalPkr;
      buckets[key].orders += 1;
    }
    for (const item of row.items as OrderItem[]) {
      itemCounts.set(item.name, (itemCounts.get(item.name) ?? 0) + item.quantity);
    }
  }

  const topItems = Array.from(itemCounts.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  const [menuCount] = await db.select({ count: sql<number>`count(*)` }).from(menuItems);
  const [outOfStock] = await db
    .select({ count: sql<number>`count(*)` })
    .from(menuItems)
    .where(sql`${menuItems.isAvailable} = 0`);

  return {
    range,
    from: from.toISOString(),
    to: to.toISOString(),
    granularity,
    orderCount,
    revenuePkr,
    needsActionCount,
    menuItemCount: Number(menuCount?.count ?? 0),
    outOfStockCount: Number(outOfStock?.count ?? 0),
    revenueSeries: Object.values(buckets),
    topItems,
  };
}
