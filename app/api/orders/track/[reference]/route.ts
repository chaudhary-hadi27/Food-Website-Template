import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { serializeOrder } from "@/lib/serializers";

// Public — a customer tracking their own order needs no login, just the reference
// code from their confirmation page (e.g. FB-ORD-56921IVS46). This is intentionally
// NOT looked up by numeric database ID, because sequential IDs are guessable and
// would let anyone page through /1, /2, /3... to see other customers' names,
// phone numbers, and delivery addresses.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  if (!reference || reference.length > 60) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.reference, reference)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: serializeOrder(order) });
}
