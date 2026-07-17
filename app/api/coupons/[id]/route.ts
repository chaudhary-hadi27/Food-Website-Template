import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { couponUpdateSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { eq } from "drizzle-orm";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session || (session.role !== "admin" && session.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const couponId = Number(id);
  if (!Number.isInteger(couponId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = couponUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const d = parsed.data;

  const [updated] = await db
    .update(coupons)
    .set({
      ...(d.code !== undefined && { code: d.code }),
      ...(d.discount_type !== undefined && { discountType: d.discount_type }),
      ...(d.discount_value !== undefined && { discountValue: d.discount_value }),
      ...(d.is_active !== undefined && { isActive: d.is_active }),
      ...(d.max_uses !== undefined && { maxUses: d.max_uses }),
      ...(d.expires_at !== undefined && { expiresAt: d.expires_at ? new Date(d.expires_at) : null }),
    })
    .where(eq(coupons.id, couponId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  return NextResponse.json({ coupon: serialize(updated) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session || (session.role !== "admin" && session.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const couponId = Number(id);
  if (!Number.isInteger(couponId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [deleted] = await db.delete(coupons).where(eq(coupons.id, couponId)).returning();
  if (!deleted) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
