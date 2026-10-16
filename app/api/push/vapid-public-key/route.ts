import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";

// Admin only — the public key itself is safe to expose (it's meant to be public), but we
// gate it behind auth anyway since there's no reason a logged-out visitor needs it.
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "Push notifications are not configured on this server yet." }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
