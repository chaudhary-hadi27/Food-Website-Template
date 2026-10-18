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
  History,
  AlignJustify,
  X,
  LogOut,
  Flame,
} from "@/components/ui/icons";
import type { LucideIcon } from "lucide-react";
import { playNewOrderAlert } from "@/lib/order-alert-sound";
import { registerServiceWorker } from "@/lib/push-client";

const NAV_ITEMS: {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
  roles: AdminRole[];
}[] = [
  { href: "/admin",                   label: "Dashboard",      Icon: LayoutDashboard, exact: true, roles: ["admin","manager","kitchen"] },
  { href: "/admin/orders",            label: "Orders",         Icon: ClipboardList,                roles: ["admin","manager","kitchen"] },
  { href: "/admin/history",           label: "History",        Icon: History,                      roles: ["admin","manager"] },
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
    // Registers the service worker (no-op if already registered, and does not by itself
    // ask for notification permission — that only happens if the admin turns on Order
    // Alerts in Settings) so that if push IS enabled elsewhere, this tab can still receive
    // the "play the voice now" relay message below.
    registerServiceWorker();

    function handleSwMessage(event: MessageEvent) {
      if (event.data?.type === "NEW_ORDER_PUSH") {
        playNewOrderAlert();
      }
    }
    navigator.serviceWorker?.addEventListener?.("message", handleSwMessage);
    return () => navigator.serviceWorker?.removeEventListener?.("message", handleSwMessage);
  }, []);

  useEffect(() => {
    // Asks a tiny count-only endpoint (not the whole order list), every 15s, and only while
    // this tab is visible — a background tab no longer keeps hitting the server (or keeps
    // the database awake). New-order push notifications still arrive when the tab is hidden.
    async function checkOrders() {
      try {
        const res = await fetch("/api/orders/pending-count", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { count: number };
          const count = Number(data.count) || 0;

          // If count of pending orders increased, play the alert!
          if (count > prevCount.current) {
            playNewOrderAlert();
          }
          prevCount.current = count;
          setPendingCount(count);
        }
      } catch (e) {
        console.error("Failed to poll pending orders in sidebar", e);
      }
    }

    let interval: ReturnType<typeof setInterval> | null = null;
    function start() {
      if (!interval) interval = setInterval(checkOrders, 15000);
    }
    function stop() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }
    function onVisibility() {
      if (document.hidden) stop();
      else {
        checkOrders();
        start();
      }
    }

    checkOrders();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

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
