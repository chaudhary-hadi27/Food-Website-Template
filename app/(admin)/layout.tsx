import type { Metadata } from "next";

// Points every /admin/* route (login included) at the admin-only manifest instead of the
// customer-facing one from app/manifest.ts, so "Install app" in Chrome/Edge — or Add to
// Home Screen on Android — installs a distinct "<Restaurant> Admin" app for staff.
export const metadata: Metadata = {
  manifest: "/admin-manifest.webmanifest",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
