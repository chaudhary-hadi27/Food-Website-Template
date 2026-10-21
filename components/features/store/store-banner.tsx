"use client";

import { useStore } from "./store-context";

/** Shown on every public page while the restaurant is closed or has paused orders. */
export function StoreBanner() {
  const store = useStore();
  if (store.canOrder) return null;
  return (
    <div role="status" className="bg-[#B42318] px-4 py-2.5 text-center text-sm font-semibold text-white">
      {store.message}
    </div>
  );
}
