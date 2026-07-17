"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types";

const NAV_ITEMS: { href: string; label: string; icon: string; exact?: boolean; roles: AdminRole[] }[] = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true, roles: ["admin", "manager", "kitchen"] },
  { href: "/admin/orders", label: "Orders", icon: "🧾", roles: ["admin", "manager", "kitchen"] },
  { href: "/admin/reservations", label: "Reservations", icon: "📅", roles: ["admin", "manager"] },
  { href: "/admin/menu", label: "Menu", icon: "🍔", roles: ["admin", "manager"] },
  { href: "/admin/coupons", label: "Coupons", icon: "🏷️", roles: ["admin", "manager"] },
  { href: "/admin/staff", label: "Staff", icon: "👥", roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", roles: ["admin"] },
];

export function AdminSidebar({ email, role }: { email: string; role: AdminRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const content = (
    <>
      <div className="border-b border-[var(--color-border)] px-6 py-5">
        <p className="font-[var(--font-display)] text-lg font-bold">Flaming Bites</p>
        <p className="text-xs text-[var(--color-text-secondary)]">Admin Dashboard</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] p-4">
        <p className="truncate text-xs text-[var(--color-text-secondary)]">{email}</p>
        <p className="text-[11px] capitalize text-[var(--color-text-tertiary)]">{role}</p>
        <button
          onClick={handleLogout}
          className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)]"
        >
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-3 lg:hidden">
        <p className="font-[var(--font-display)] text-base font-bold">Flaming Bites Admin</p>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)]"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)]"
              aria-label="Close menu"
            >
              ✕
            </button>
            {content}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-white lg:flex">
        {content}
      </aside>
    </>
  );
}
