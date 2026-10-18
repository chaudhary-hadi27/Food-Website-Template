import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, loyaltyAccounts } from "@/lib/db/schema";
import { eq, desc, sql, ilike } from "drizzle-orm";
import { serializeOrder } from "@/lib/serializers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`order-lookup:${ip}`, 20, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many lookups. Please wait a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const searchInput = (body?.query ?? body?.phone ?? "").trim();

  if (!searchInput) {
    return NextResponse.json({ error: "Please enter a valid phone number or Order ID." }, { status: 400 });
  }

  // 1. Try matching as an Order Reference ID (e.g. ODR-Jul-26-001 or FB-ORD-...)
  const isOrderRef = searchInput.toUpperCase().startsWith("ODR-") || 
                     searchInput.toUpperCase().startsWith("FB-") || 
                     (searchInput.length > 5 && /[a-zA-Z]/.test(searchInput));

  if (isOrderRef) {
    // Exact match first so the unique index on `reference` is used; the case-insensitive
    // scan below only runs when someone typed the ID in a different case.
    let [byRef] = await db.select().from(orders).where(eq(orders.reference, searchInput)).limit(1);
    if (!byRef) {
      [byRef] = await db
        .select()
        .from(orders)
        .where(sql`LOWER(${orders.reference}) = LOWER(${searchInput})`)
        .limit(1);
    }

    if (byRef) {
      const [loyalty] = await db
        .select()
        .from(loyaltyAccounts)
        .where(eq(loyaltyAccounts.phone, byRef.customerPhone))
        .limit(1);

      return NextResponse.json({
        orders: [serializeOrder(byRef)],
        loyalty_points: loyalty?.points ?? 0,
      });
    }
  }

  // 2. Otherwise, treat as Phone number search (normalize +92, 92, 0, spaces, dashes)
  const normalizedPhone = normalizePhone(searchInput);

  // Search orders matching normalized phone or raw input
  const rows = await db
    .select()
    .from(orders)
    .where(
      sql`${orders.customerPhone} = ${normalizedPhone} OR ${orders.customerPhone} = ${searchInput}`
    )
    .orderBy(desc(orders.createdAt))
    .limit(20);

  const [loyalty] = await db
    .select()
    .from(loyaltyAccounts)
    .where(
      sql`${loyaltyAccounts.phone} = ${normalizedPhone} OR ${loyaltyAccounts.phone} = ${searchInput}`
    )
    .limit(1);

  return NextResponse.json({
    orders: rows.map(serializeOrder),
    loyalty_points: loyalty?.points ?? 0,
  });
}
