import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { staffUpdateSchema } from "@/lib/validations";
import { getAdminSession } from "@/lib/session";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const staffId = Number(id);
  if (!Number.isInteger(staffId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = staffUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const d = parsed.data;

  // Guard: don't let the last admin demote themselves (or be demoted), otherwise
  // nobody would be left who can manage staff/settings.
  if (d.role && d.role !== "admin") {
    const [target] = await db.select().from(admins).where(eq(admins.id, staffId)).limit(1);
    if (target?.role === "admin") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(admins)
        .where(eq(admins.role, "admin"));
      if (Number(count) <= 1) {
        return NextResponse.json({ error: "You can't remove the last admin account." }, { status: 400 });
      }
    }
  }

  const passwordHash = d.password ? await bcrypt.hash(d.password, 10) : undefined;

  const [updated] = await db
    .update(admins)
    .set({
      ...(d.role !== undefined && { role: d.role }),
      ...(passwordHash !== undefined && { passwordHash }),
    })
    .where(eq(admins.id, staffId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  return NextResponse.json({
    staff: { id: updated.id, email: updated.email, role: updated.role, created_at: updated.createdAt },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const staffId = Number(id);
  if (!Number.isInteger(staffId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [target] = await db.select().from(admins).where(eq(admins.id, staffId)).limit(1);
  if (!target) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  if (target.role === "admin") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(admins)
      .where(eq(admins.role, "admin"));
    if (Number(count) <= 1) {
      return NextResponse.json({ error: "You can't remove the last admin account." }, { status: 400 });
    }
  }

  await db.delete(admins).where(eq(admins.id, staffId));
  return NextResponse.json({ success: true });
}
