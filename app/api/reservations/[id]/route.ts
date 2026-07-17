import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { reservationStatusUpdateSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { serializeReservation } from "@/lib/serializers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = reservationStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const [updated] = await db
    .update(reservations)
    .set({ status: parsed.data.status })
    .where(eq(reservations.id, itemId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  return NextResponse.json({ reservation: serializeReservation(updated) });
}
