import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { reservationSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { generateReference } from "@/lib/utils";
import { desc } from "drizzle-orm";
import { serializeReservation } from "@/lib/serializers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`reservation:${ip}`, 10, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many reservation requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid reservation data" }, { status: 400 });
  }
  const data = parsed.data;
  const reference = generateReference("FB-RES");

  const [created] = await db
    .insert(reservations)
    .values({
      reference,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      partySize: data.party_size,
      reservationDate: data.reservation_date,
      reservationTime: data.reservation_time,
      specialRequests: data.special_requests,
      status: "pending",
    })
    .returning();

  return NextResponse.json({ reservation: serializeReservation(created) }, { status: 201 });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(reservations).orderBy(desc(reservations.createdAt));
  return NextResponse.json({ reservations: rows.map(serializeReservation) });
}
