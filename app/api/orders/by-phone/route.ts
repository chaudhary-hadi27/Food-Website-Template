import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, loyaltyAccounts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { serializeOrder } from "@/lib/serializers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  phone: z.string().regex(/^(\+92|0)?3\d{9}$/, "Enter a valid Pakistani mobile number"),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // A phone number is a weak "credential" here (no password), so this is rate-limited
  // fairly tightly to make it impractical to enumerate other customers' phone numbers.
  const limit = rateLimit(`order-lookup:${ip}`, 15, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many lookups. Please wait a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.customerPhone, parsed.data.phone))
    .orderBy(desc(orders.createdAt))
    .limit(20);

  const [loyalty] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.phone, parsed.data.phone)).limit(1);

  return NextResponse.json({
    orders: rows.map(serializeOrder),
    loyalty_points: loyalty?.points ?? 0,
  });
}
