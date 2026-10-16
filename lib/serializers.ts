import type { MenuItem, Order, Reservation, OrderItem } from "@/types";

type DbMenuItem = {
  id: number;
  name: string;
  description: string;
  category: string;
  pricePkr: number;
  imageUrl: string;
  isAvailable: number;
  isBestseller: number;
  rating: number;
  createdAt: Date | string;
};

export function serializeMenuItem(row: DbMenuItem): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as MenuItem["category"],
    price_pkr: row.pricePkr,
    image_url: row.imageUrl,
    is_available: row.isAvailable ? 1 : 0,
    is_bestseller: row.isBestseller ? 1 : 0,
    rating: row.rating,
    created_at: String(row.createdAt),
  };
}

type DbOrder = {
  id: number;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLat: number | null;
  customerLng: number | null;
  items: unknown;
  subtotalPkr: number;
  deliveryFeePkr: number;
  discountPkr: number;
  couponCode: string | null;
  loyaltyPointsEarned: number;
  totalPkr: number;
  paymentMethod: string;
  paymentProofUrl: string | null;
  paymentVerified: number;
  paymentOcrResult: string | null;
  status: string;
  estimatedDeliveryMinutes: number;
  createdAt: Date | string;
};

export function serializeOrder(row: DbOrder): Order {
  return {
    id: row.id,
    reference: row.reference,
    customer_name: row.customerName,
    customer_phone: row.customerPhone,
    customer_address: row.customerAddress,
    customer_lat: row.customerLat ?? null,
    customer_lng: row.customerLng ?? null,
    items: row.items as OrderItem[],
    subtotal_pkr: row.subtotalPkr,
    delivery_fee_pkr: row.deliveryFeePkr,
    discount_pkr: row.discountPkr,
    coupon_code: row.couponCode,
    loyalty_points_earned: row.loyaltyPointsEarned,
    total_pkr: row.totalPkr,
    payment_method: row.paymentMethod as Order["payment_method"],
    payment_proof_url: row.paymentProofUrl ?? "",
    payment_verified: row.paymentVerified ? 1 : 0,
    payment_ocr_result: row.paymentOcrResult ?? "",
    status: row.status as Order["status"],
    estimated_delivery_minutes: row.estimatedDeliveryMinutes,
    created_at: new Date(row.createdAt).toISOString(),
  };
}

type DbReservation = {
  id: number;
  reference: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  specialRequests: string;
  status: string;
  createdAt: Date | string;
};

export function serializeReservation(row: DbReservation): Reservation {
  return {
    id: row.id,
    reference: row.reference,
    customer_name: row.customerName,
    customer_phone: row.customerPhone,
    party_size: row.partySize,
    reservation_date: row.reservationDate,
    reservation_time: row.reservationTime,
    special_requests: row.specialRequests,
    status: row.status as Reservation["status"],
    created_at: new Date(row.createdAt).toISOString(),
  };
}
