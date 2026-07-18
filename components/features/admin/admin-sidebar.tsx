"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Tag,
  Settings2,
  Layers,
  AlignJustify,
  X,
  LogOut,
  Flame,
} from "@/components/ui/icons";
import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
  roles: AdminRole[];
}[] = [
  { href: "/admin",                   label: "Dashboard",      Icon: LayoutDashboard, exact: true, roles: ["admin","manager","kitchen"] },
  { href: "/admin/orders",            label: "Orders",         Icon: ClipboardList,                roles: ["admin","manager","kitchen"] },
  { href: "/admin/menu",              label: "Menu",           Icon: UtensilsCrossed,              roles: ["admin","manager"] },
  { href: "/admin/coupons",           label: "Coupons",        Icon: Tag,                          roles: ["admin","manager"] },
  { href: "/admin/settings",          label: "Settings",       Icon: Settings2,                    roles: ["admin"] },
  { href: "/admin/settings/homepage", label: "Homepage",       Icon: Layers,                       roles: ["admin","manager"] },
];

export function AdminSidebar({
  email,
  role,
  restaurantName,
}: {
  email: string;
  role: AdminRole;
  restaurantName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const prevCount = useRef(0);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  useEffect(() => {
    async function checkOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          const pOrders = (data.orders || []).filter((o: any) => o.status === "pending");
          const count = pOrders.length;

          // If count of pending orders increased, play the chime!
          if (count > prevCount.current) {
            playNotificationSound();
          }
          prevCount.current = count;
          setPendingCount(count);
        }
      } catch (e) {
        console.error("Failed to poll orders in sidebar", e);
      }
    }

    checkOrders();
    const interval = setInterval(checkOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Audio Context playback not allowed by browser autoplay policy yet.", e);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const content = (
    <>
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-6 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)]">
          <Flame className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-[var(--font-display)] text-base font-bold leading-tight text-[var(--color-text-primary)] truncate">
            {restaurantName}
          </p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && item.href !== "/admin";
          const isAdminExact = item.href === "/admin" && pathname === "/admin";
          const finalActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const isOrders = item.label === "Orders";

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                finalActive
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent-dark)]"
              )}
            >
              <item.Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {isOrders && pendingCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-[10px] font-bold text-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] p-4">
        <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">{email}</p>
        <p className="mt-0.5 text-[11px] capitalize text-[var(--color-text-tertiary)]">{role}</p>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--color-border)] bg-white/90 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]">
            <Flame className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="font-[var(--font-display)] text-base font-bold truncate">{restaurantName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pendingCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-[10px] font-bold text-white animate-pulse">
              {pendingCount}
            </span>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] transition-colors hover:bg-[var(--color-accent-light)]"
            aria-label="Open menu"
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-accent-light)]"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
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
