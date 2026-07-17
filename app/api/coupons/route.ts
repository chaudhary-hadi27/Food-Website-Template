import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { couponSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { desc } from "drizzle-orm";

function serialize(row: typeof coupons.$inferSelect) {
  return {
    id: row.id,
    code: row.code,
    discount_type: row.discountType as "percent" | "fixed",
    discount_value: row.discountValue,
    is_active: row.isActive as 0 | 1,
    usage_count: row.usageCount,
    max_uses: row.maxUses,
    expires_at: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
    created_at: new Date(row.createdAt).toISOString(),
  };
}

export async function GET() {
  const session = await getAdminSession();
  if (!session || (session.role !== "admin" && session.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return NextResponse.json({ coupons: rows.map(serialize) });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || (session.role !== "admin" && session.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await db.query.coupons.findFirst({ where: (c, { eq }) => eq(c.code, d.code) });
  if (existing) return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });

  const [created] = await db
    .insert(coupons)
    .values({
      code: d.code,
      discountType: d.discount_type,
      discountValue: d.discount_value,
      isActive: d.is_active,
      maxUses: d.max_uses ?? null,
      expiresAt: d.expires_at ? new Date(d.expires_at) : null,
    })
    .returning();

  return NextResponse.json({ coupon: serialize(created) }, { status: 201 });
}
