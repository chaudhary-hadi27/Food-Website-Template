export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function normalizePhone(input: string): string {
  if (!input) return "";
  const cleaned = input.trim().replace(/[\s\-\(\)]/g, "");
  let digits = cleaned.replace(/\D/g, "");

  // Convert +923001234567 or 923001234567 -> 03001234567
  if (digits.startsWith("92") && digits.length === 12) {
    return "0" + digits.slice(2);
  }
  // Convert 3001234567 -> 03001234567
  if (digits.length === 10 && digits.startsWith("3")) {
    return "0" + digits;
  }
  // Convert 03001234567 -> 03001234567
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits;
  }

  return digits || input;
}

export function generateOrderReference(orderCount: number, date = new Date()): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  const numStr = String(orderCount + 1).padStart(3, "0");
  return `ODR-${month}-${year}-${numStr}`;
}

export function generateReference(prefix: string) {
  // Use crypto.randomUUID() for true uniqueness — strip dashes, take first 12 hex chars,
  // uppercase them. Result format: FB-ORD-4A9E2B7C1D3F (100% unique per call).
  const uuid = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `${prefix}-${uuid.slice(0, 12)}`;
}
