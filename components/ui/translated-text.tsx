"use client";

import { useLanguage } from "@/lib/i18n";

export function T({ k }: { k: Parameters<ReturnType<typeof useLanguage>["t"]>[0] }) {
  const { t } = useLanguage();
  return <>{t(k)}</>;
}
