"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push-client";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
