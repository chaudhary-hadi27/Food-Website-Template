import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { applyCouponSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = applyCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase().trim();
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: "This coupon code is not valid." }, { status: 404 });
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
  }
  if (coupon.maxUses !== null && coupon.usageCount >= coupon.maxUses) {
    return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
  }

  const subtotal = parsed.data.subtotal_pkr;
  const discount =
    coupon.discountType === "percent"
      ? Math.round((subtotal * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, subtotal);

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    discount_type: coupon.discountType,
    discount_value: coupon.discountValue,
    discount_pkr: discount,
  });
}
