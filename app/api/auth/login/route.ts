import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { verifyAdminCredentials, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // Max 8 login attempts per 10 minutes per IP — slows brute-force attempts
  // without locking out a real admin who mistypes their password a few times.
  const limit = rateLimit(`login:${ip}`, 8, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Please try again in ${Math.ceil(limit.retryAfterMs / 60_000)} minute(s).` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email and password (min 6 characters)." },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const account = await verifyAdminCredentials(email, password);
  if (!account) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const token = await createSessionToken(account.email, account.role);
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
