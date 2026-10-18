import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { MENU_CACHE_TAG } from "@/lib/menu-cache";
import { db } from "@/lib/db";
import { menuItems } from "@/lib/db/schema";
import { menuItemUpdateSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { serializeMenuItem } from "@/lib/serializers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = menuItemUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const d = parsed.data;

  const [updated] = await db
    .update(menuItems)
    .set({
      ...(d.name !== undefined && { name: d.name }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.category !== undefined && { category: d.category }),
      ...(d.price_pkr !== undefined && { pricePkr: d.price_pkr }),
      ...(d.image_url !== undefined && { imageUrl: d.image_url }),
      ...(d.is_available !== undefined && { isAvailable: d.is_available }),
      ...(d.is_bestseller !== undefined && { isBestseller: d.is_bestseller }),
      ...(d.rating !== undefined && { rating: d.rating }),
    })
    .where(eq(menuItems.id, itemId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  revalidateTag(MENU_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ item: serializeMenuItem(updated) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [deleted] = await db.delete(menuItems).where(eq(menuItems.id, itemId)).returning();
  if (!deleted) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  revalidateTag(MENU_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ success: true });
}
