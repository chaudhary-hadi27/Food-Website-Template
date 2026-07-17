import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, reservations, menuItems } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/session";
import { gte, sql } from "drizzle-orm";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const [menuCount] = await db.select({ count: sql<number>`count(*)` }).from(menuItems);
  const [outOfStock] = await db
    .select({ count: sql<number>`count(*)` })
    .from(menuItems)
    .where(sql`${menuItems.isAvailable} = 0`);

  return NextResponse.json({
    todayOrderCount: Number(todayOrders?.count ?? 0),
    todayRevenuePkr: Number(todayOrders?.revenue ?? 0),
    pendingOrderCount: Number(pendingOrders?.count ?? 0),
    pendingReservationCount: Number(pendingReservations?.count ?? 0),
    menuItemCount: Number(menuCount?.count ?? 0),
    outOfStockCount: Number(outOfStock?.count ?? 0),
  });
}
