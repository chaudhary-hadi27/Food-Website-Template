import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, loyaltyAccounts } from "@/lib/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { serializePublicOrder } from "@/lib/serializers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";

// Public — "My Orders" lookup by phone number or order code. Returns the PUBLIC (partly
// hidden) view of each order, so looking up someone else's number never reveals their
// address, full name, location or payment screenshot.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`order-lookup:${ip}`, 20, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many lookups. Please wait a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const searchInput = String(body?.query ?? body?.phone ?? "").trim().slice(0, 40);

  if (!searchInput) {
    return NextResponse.json({ error: "Please enter a valid phone number or Order ID." }, { status: 400 });
  }

  // 1. Try matching as an order code (new: K7Q2X9; older: ODR-Jul-26-001 / FB-ORD-...).
  //    Anything containing a letter can't be a phone number.
  const looksLikeRef = /[a-zA-Z]/.test(searchInput);
  if (looksLikeRef) {
    const compact = searchInput.replace(/\s+/g, "");
    let [byRef] = await db.select().from(orders).where(eq(orders.reference, compact.toUpperCase())).limit(1);
    if (!byRef) {
      [byRef] = await db
        .select()
        .from(orders)
        .where(sql`LOWER(${orders.reference}) = LOWER(${compact})`)
        .limit(1);
    }

    if (byRef) {
      const [loyalty] = await db
        .select()
        .from(loyaltyAccounts)
        .where(eq(loyaltyAccounts.phone, byRef.customerPhone))
        .limit(1);

      return NextResponse.json({
        orders: [serializePublicOrder(byRef)],
        loyalty_points: loyalty?.points ?? 0,
      });
    }
  }

  // 2. Otherwise, treat as a phone number (normalise +92, 92, 0, spaces, dashes).
  const normalizedPhone = normalizePhone(searchInput);
  const phones = [...new Set([normalizedPhone, searchInput])];

  const rows = await db
    .select()
    .from(orders)
    .where(inArray(orders.customerPhone, phones))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  const [loyalty] = await db
    .select()
    .from(loyaltyAccounts)
    .where(inArray(loyaltyAccounts.phone, phones))
    .limit(1);

  return NextResponse.json({
    orders: rows.map(serializePublicOrder),
    loyalty_points: loyalty?.points ?? 0,
  });
}
