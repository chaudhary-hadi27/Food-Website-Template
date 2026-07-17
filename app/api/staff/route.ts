import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { staffCreateSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({ id: admins.id, email: admins.email, role: admins.role, createdAt: admins.createdAt })
    .from(admins);
  return NextResponse.json({
    staff: rows.map((r) => ({ id: r.id, email: r.email, role: r.role, created_at: r.createdAt })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = staffCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const existing = await db.select().from(admins).where(eq(admins.email, parsed.data.email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [created] = await db
    .insert(admins)
    .values({ email: parsed.data.email, passwordHash, role: parsed.data.role })
    .returning();

  return NextResponse.json(
    { staff: { id: created.id, email: created.email, role: created.role, created_at: created.createdAt } },
    { status: 201 }
  );
}
