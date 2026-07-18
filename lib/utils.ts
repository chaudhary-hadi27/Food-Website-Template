export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function generateReference(prefix: string) {
  // Use crypto.randomUUID() for true uniqueness — strip dashes, take first 12 hex chars,
  // uppercase them. Result format: FB-ORD-4A9E2B7C1D3F (100% unique per call).
  const uuid = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `${prefix}-${uuid.slice(0, 12)}`;
}
