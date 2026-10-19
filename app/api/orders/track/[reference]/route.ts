import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { serializePublicOrder } from "@/lib/serializers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Public — a customer tracking their own order needs no login, just the order code from
// their confirmation page (e.g. K7Q2X9).
//
// Privacy: this endpoint can be called by anyone who knows (or guesses) a code, so it only
// ever returns the PUBLIC view of an order — name, phone and address are partly hidden and
// there is no location, payment screenshot or database id. New codes are random (not
// sequential); older ODR-style codes are still guessable, which is exactly why the response
// is masked instead of relying on the code being secret.
export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  // The tracking page refreshes every few seconds, so this is generous for a real customer
  // (even several people behind one shared IP) but stops anyone scanning codes in bulk.
  const limit = await rateLimit(`track:${getClientIp(req)}`, 300, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }

  const { reference: raw } = await params;
  const reference = decodeURIComponent(raw ?? "").trim();
  if (!reference || reference.length > 40) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  // New codes are upper-case; customers may type lower-case, and older orders keep mixed case.
  let [order] = await db.select().from(orders).where(eq(orders.reference, reference.toUpperCase())).limit(1);
  if (!order) {
    [order] = await db
      .select()
      .from(orders)
      .where(sql`LOWER(${orders.reference}) = LOWER(${reference})`)
      .limit(1);
  }
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: serializePublicOrder(order) }, { headers: { "Cache-Control": "no-store" } });
}
