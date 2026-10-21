import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import type { AdminRole } from "@/types";

// Pages restricted to certain roles. Anything under /admin not listed here is
// open to any authenticated staff member (e.g. the dashboard home, orders).
const ROLE_RESTRICTED_PREFIXES: { prefix: string; roles: AdminRole[] }[] = [
  { prefix: "/admin/staff", roles: ["admin"] },
  { prefix: "/admin/settings", roles: ["admin"] },
  { prefix: "/admin/coupons", roles: ["admin", "manager"] },
  { prefix: "/admin/menu", roles: ["admin", "manager"] },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const restriction = ROLE_RESTRICTED_PREFIXES.find((r) => pathname.startsWith(r.prefix));
    if (restriction && !restriction.roles.includes(session.role)) {
      const dashboardUrl = new URL("/admin", req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
