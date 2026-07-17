import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/session";
import { gte } from "drizzle-orm";
import type { OrderItem } from "@/types";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const rows = await db.select().from(orders).where(gte(orders.createdAt, sevenDaysAgo));

  // Build a revenue-per-day series for the last 7 days (including days with zero orders).
  const dayBuckets: Record<string, { date: string; revenue: number; orders: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    dayBuckets[key] = { date: key, revenue: 0, orders: 0 };
  }
  for (const row of rows) {
    if (row.status === "cancelled") continue;
    const key = new Date(row.createdAt).toISOString().split("T")[0];
    if (dayBuckets[key]) {
      dayBuckets[key].revenue += row.totalPkr;
      dayBuckets[key].orders += 1;
    }
  }

  // Top-selling items by quantity across the same window.
  const itemCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.status === "cancelled") continue;
    const items = row.items as OrderItem[];
    for (const item of items) {
      itemCounts.set(item.name, (itemCounts.get(item.name) ?? 0) + item.quantity);
    }
  }
  const topItems = Array.from(itemCounts.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return NextResponse.json({
    revenueByDay: Object.values(dayBuckets),
    topItems,
  });
}
