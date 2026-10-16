import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { admins } from "./db/schema";
import { eq } from "drizzle-orm";
import type { AdminRole } from "@/types";

// `next build` imports this module only to collect page data and never signs a session,
// so the missing-secret check is skipped for that phase alone. At runtime in production
// a missing SESSION_SECRET still fails loudly — tokens are never signed with a known key.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const SECRET_STRING =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === "production" && !isBuildPhase
    ? (() => {
        throw new Error(
          "SESSION_SECRET is not set. Set a long random value (e.g. `openssl rand -base64 32`) in your production environment before deploying — without it, admin sessions are not secure."
        );
      })()
    : "dev-only-secret-change-in-production-env");

const SECRET = new TextEncoder().encode(SECRET_STRING);

export const SESSION_COOKIE = "fb_admin_session";

export async function createSessionToken(email: string, role: AdminRole) {
  return await new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { email: string; role: AdminRole };
  } catch {
    return null;
  }
}

export async function verifyAdminCredentials(email: string, password: string) {
  const rows = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  const admin = rows[0];
  if (!admin) return null;
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;
  return { email: admin.email, role: admin.role as AdminRole };
}
