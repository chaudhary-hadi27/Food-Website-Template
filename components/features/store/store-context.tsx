"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getStoreStatus, type StoreStatus } from "@/lib/store-rules";

export interface StoreInputs {
  business_open_time: string;
  business_close_time: string;
  orders_paused: string;
  min_order_pkr: string;
}

const StoreContext = createContext<StoreStatus | null>(null);

/**
 * Gives every public page the same answer the server will give when an order arrives
 * ("open / closed / paused" + minimum order). Re-evaluated every minute so a page left open
 * flips to "closed" on its own. The server still re-checks on every order — this is only
 * so the customer finds out BEFORE filling the whole checkout form.
 */
export function StoreProvider({ inputs, children }: { inputs: StoreInputs; children: React.ReactNode }) {
  const [status, setStatus] = useState<StoreStatus>(() => getStoreStatus(inputs as unknown as Record<string, string>));

  useEffect(() => {
    const tick = () => setStatus(getStoreStatus(inputs as unknown as Record<string, string>));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [inputs.business_open_time, inputs.business_close_time, inputs.orders_paused, inputs.min_order_pkr]); // eslint-disable-line react-hooks/exhaustive-deps

  return <StoreContext.Provider value={status}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreStatus {
  return useContext(StoreContext) ?? { state: "open", canOrder: true, message: "", minOrderPkr: 0 };
}
