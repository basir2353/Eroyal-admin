export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ShippingAddress = {
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

export type OrderRecord = Record<string, unknown> & {
  _id?: string;
  id?: string;
  orderNumber?: string;
  status?: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentStatusLabel?: string;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: ShippingAddress;
  };
  shippingAddress?: ShippingAddress;
  customer?: { name?: string; email?: string; phone?: string };
  items?: Record<string, unknown>[];
  itemCount?: number;
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  discount?: number;
  total?: number;
  couponCode?: string;
  notes?: string;
  trackingNumber?: string;
  timeline?: { status?: string; note?: string; createdAt?: string }[];
  createdAt?: string;
};

export function orderId(order: OrderRecord) {
  return String(order._id ?? order.id ?? "");
}

export function orderStatus(order: OrderRecord): OrderStatus {
  const raw = String(order.status ?? order.orderStatus ?? "pending").toLowerCase();
  return (ORDER_STATUSES.includes(raw as OrderStatus) ? raw : "pending") as OrderStatus;
}

export function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "success" | "warning" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "delivered":
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "processing":
    case "shipped":
      return "default";
    case "cancelled":
    case "refunded":
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}

export function formatPaymentMethod(method?: string) {
  if (!method) return "—";
  if (method === "cash_on_delivery") return "Cash on delivery";
  return method.replace(/_/g, " ");
}

export function getCustomerName(order: OrderRecord) {
  return String(
    order.customerName ??
      order.customerInfo?.name ??
      order.customer?.name ??
      "—",
  );
}

export function getCustomerEmail(order: OrderRecord) {
  return String(
    order.customerEmail ??
      order.customerInfo?.email ??
      order.customer?.email ??
      "—",
  );
}

export function getCustomerPhone(order: OrderRecord) {
  return String(
    order.customerPhone ??
      order.customerInfo?.phone ??
      order.customer?.phone ??
      "—",
  );
}

export function getShippingAddress(order: OrderRecord): ShippingAddress {
  const addr =
    order.shippingAddress ??
    order.customerInfo?.address ??
    {};
  return typeof addr === "object" && addr ? (addr as ShippingAddress) : {};
}

export function formatAddressLines(address: ShippingAddress) {
  const lines = [
    address.company,
    address.address1,
    address.address2,
    [address.city, address.state, address.postcode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
  return lines.length ? lines : ["—"];
}

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
