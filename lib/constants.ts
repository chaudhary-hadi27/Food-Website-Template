export const CATEGORIES = ["Gourmet Burgers", "Premium Sides", "Artisan Drinks", "Desserts"] as const;

export const PAYMENT_METHODS: { value: string; label: string; hint: string }[] = [
  { value: "cod", label: "Cash on Delivery", hint: "Pay in cash when your order arrives" },
  { value: "jazzcash", label: "JazzCash", hint: "Send payment to our JazzCash number, we'll confirm by SMS" },
  { value: "easypaisa", label: "EasyPaisa", hint: "Send payment to our EasyPaisa number, we'll confirm by SMS" },
  { value: "bank_transfer", label: "Bank Transfer", hint: "Transfer to our bank account, share the receipt on WhatsApp" },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Order received",
  preparing: "Being prepared",
  ready: "Ready for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_STEPS = ["pending", "preparing", "ready", "delivered"] as const;

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  declined: "Declined",
  completed: "Completed",
};
