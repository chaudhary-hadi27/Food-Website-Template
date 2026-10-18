import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { getAdminSession } from "@/lib/session";
import { getSiteSettings } from "@/lib/get-settings";
import { getCurrentBusinessDayStart } from "@/lib/business-hours";

// Admin only — a tiny "how many orders are waiting?" check for the sidebar badge and the
// new-order sound. One indexed COUNT(*) instead of downloading the whole order list every
// few seconds from every open admin tab.
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getSiteSettings();
  const businessDayStart = getCurrentBusinessDayStart(settings.business_close_time);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(eq(orders.status, "pending"), gte(orders.createdAt, businessDayStart)));

  return NextResponse.json({ count: Number(count ?? 0) }, { headers: { "Cache-Control": "no-store" } });
}
