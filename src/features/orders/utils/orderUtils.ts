const STATUS_MAP: Record<string, { label: string; className: string }> = {
  Pending: { label: "Chờ thanh toán", className: "bg-amber-50 text-amber-700" },
  Paid: { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700" },
  Processing: { label: "Đang xử lý", className: "bg-blue-50 text-blue-700" },
  Completed: { label: "Đã hoàn thành", className: "bg-green-50 text-green-700" },
  Cancelled: { label: "Đã hủy", className: "bg-red-50 text-red-700" },
  Expired: { label: "Đã hết hạn", className: "bg-gray-100 text-gray-500" },
};

export function getOrderStatusMeta(status: string, paymentMethod?: string) {
  if (status === "Pending" && paymentMethod === "COD") {
    return { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700" };
  }
  return (
    STATUS_MAP[status] ?? {
      label: status,
      className: "bg-gray-100 text-gray-700",
    }
  );
}

export function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export function formatOrderDate(date: string): string {
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PAYMENT_METHODS = [
  { value: "PayOS", label: "Thanh toán PayOS (QR / chuyển khoản)" },
  { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
] as const;

export const DELIVERY_STATUSES = [
  "Pending",
  "PickedUp",
  "InTransit",
  "Delivered",
  "Cancelled",
] as const;
