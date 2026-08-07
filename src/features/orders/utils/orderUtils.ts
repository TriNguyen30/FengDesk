export const STATUS_MAP: Record<string, { label: string; className: string }> = {
  Pending: { label: "Đang chờ", className: "bg-amber-50 text-amber-600 border-amber-200" },
  Paid: { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  Processing: { label: "Đang xử lý", className: "bg-blue-50 text-blue-600 border-blue-200" },
  Shipping: { label: "Đang vận chuyển", className: "bg-sky-50 text-sky-600 border-sky-200" },
  Completed: { label: "Đã hoàn thành", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  Cancelled: { label: "Đã hủy", className: "bg-red-50 text-red-500 border-red-200" },
  Expired: { label: "Đã hết hạn", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

export function getOrderStatusMeta(status: string, paymentMethod?: string) {
  if (status === "Pending" && paymentMethod === "COD") {
    return { label: "Đang xử lý", className: "bg-amber-50 text-amber-600 border-amber-200" };
  }
  return (
    STATUS_MAP[status] ?? {
      label: status,
      className: "bg-gray-100 text-gray-500 border-gray-200",
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
