import { useEffect, useState } from "react";
import {
  Calendar,
  CreditCard,
  Loader2,
  MapPin,
  MessageSquareText,
  Package,
  Phone,
  StickyNote,
  Truck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ordersApi } from "../api/orders.api";
import type { DeliveryOrderDetail } from "../types/orders";
import { formatOrderDate, formatVnd } from "../utils/orderUtils";

const DELIVERY_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  Pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 border-amber-200" },
  Confirmed: { label: "Đã xác nhận", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  Preparing: { label: "Đang chuẩn bị", className: "bg-blue-50 text-blue-700 border-blue-200" },
  Shipped: { label: "Đang giao", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  Delivered: { label: "Đã giao", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DeliveryFailed: { label: "Giao thất bại", className: "bg-rose-50 text-rose-700 border-rose-200" },
  Returned: { label: "Đã hoàn trả", className: "bg-gray-100 text-gray-600 border-gray-200" },
  Cancelled: { label: "Đã hủy", className: "bg-red-50 text-red-700 border-red-200" },
};

interface DeliveryDetailModalProps {
  deliveryId: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Modal chi tiết đơn giao — dùng ở tab "Đơn giao" (đóng gói) và tab "Trả hàng" (nút "Xem đơn gốc")
 * của màn Shop (garden owner/staff). Gọi GET /orders/deliveries/{id}/detail — chỉ trả đúng
 * sản phẩm + thông tin thuộc store hiện tại, không lộ hàng của store khác trong cùng order.
 */
export function DeliveryDetailModal({ deliveryId, open, onClose }: DeliveryDetailModalProps) {
  const [detail, setDetail] = useState<DeliveryOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !deliveryId) {
      setDetail(null);
      return;
    }
    let active = true;
    setLoading(true);
    ordersApi
      .getDeliveryDetail(deliveryId)
      .then((res) => {
        if (!active) return;
        if (res.data.isSuccess && res.data.data) {
          setDetail(res.data.data);
        } else {
          toast.error(res.data.message || "Không thể tải chi tiết đơn giao");
        }
      })
      .catch((err) => {
        if (!active) return;
        toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi tải chi tiết đơn giao");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, deliveryId]);

  if (!open) return null;

  const statusMeta = detail
    ? (DELIVERY_STATUS_LABEL[detail.status] ?? {
        label: detail.status,
        className: "bg-gray-100 text-gray-700 border-gray-200",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              Chi tiết đơn giao
            </span>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">
              {detail ? `#${detail.id.substring(0, 8).toUpperCase()}` : "Đang tải..."}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto space-y-5 text-sm">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !detail ? (
            <p className="py-10 text-center text-sm text-gray-400">Không tìm thấy thông tin.</p>
          ) : (
            <>
              {/* Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/40">
                  <Calendar className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Ngày đặt</p>
                    <p className="font-semibold text-gray-800 mt-0.5 text-xs">
                      {formatOrderDate(detail.orderCreatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/40">
                  <CreditCard className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Thanh toán</p>
                    <p className="font-semibold text-gray-800 mt-0.5 text-xs">
                      {detail.paymentMethod === "COD"
                        ? "Thanh toán khi nhận hàng (COD)"
                        : detail.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/40">
                  <Truck className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Trạng thái giao</p>
                    <span
                      className={`inline-block mt-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${statusMeta?.className}`}
                    >
                      {statusMeta?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer info + note */}
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-primary/5 via-white to-gray-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
                        Thông tin khách hàng
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {detail.shippingAddress.recipientName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta?.className}`}
                  >
                    {statusMeta?.label}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[auto,1fr] sm:items-start">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 px-3 py-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm text-gray-700">{detail.shippingAddress.recipientPhone}</span>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white/80 px-3 py-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="text-sm leading-relaxed text-gray-700">
                      {detail.shippingAddress.fullAddressText}
                    </span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-amber-700" />
                    <h4 className="text-sm font-semibold text-amber-800">Mô tả / ghi chú của khách hàng</h4>
                  </div>
                  {detail.orderNote ? (
                    <p className="mt-2 text-sm leading-relaxed text-amber-700">
                      {detail.orderNote}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-amber-700/80">
                      Không có ghi chú nào được gửi kèm từ khách hàng.
                    </p>
                  )}
                </div>
              </div>

              {/* Items — chỉ sản phẩm thuộc đơn giao này */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Sản phẩm cần đóng gói
                </h4>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500">
                        <th className="p-3">Sản phẩm</th>
                        <th className="p-3 w-20 text-center">SL</th>
                        <th className="p-3 w-28 text-right">Đơn giá</th>
                        <th className="p-3 w-28 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detail.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                              <p className="font-semibold text-gray-800">{item.productName}</p>
                            </div>
                          </td>
                          <td className="p-3 text-center text-gray-700 font-medium">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            {formatVnd(item.unitPrice)}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-800">
                            {formatVnd(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tracking info */}
              {(detail.trackingCode || detail.shippingProvider) && (
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/20 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs text-gray-500">
                  {detail.trackingCode && (
                    <div>
                      <p className="text-gray-400">Mã vận đơn</p>
                      <p className="font-semibold text-gray-700 font-mono">
                        {detail.trackingCode}
                      </p>
                    </div>
                  )}
                  {detail.shippingProvider && (
                    <div>
                      <p className="text-gray-400">Đơn vị vận chuyển</p>
                      <p className="font-semibold text-gray-700">{detail.shippingProvider}</p>
                    </div>
                  )}
                  {detail.estimatedDeliveryDate && (
                    <div>
                      <p className="text-gray-400">Dự kiến giao</p>
                      <p className="font-semibold text-gray-700">
                        {formatOrderDate(detail.estimatedDeliveryDate)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Totals */}
              <div className="flex flex-col items-end gap-1.5 border-t border-gray-100 pt-4 text-xs font-semibold text-gray-500">
                <div className="flex justify-between w-60">
                  <span>Tạm tính:</span>
                  <span className="text-gray-800">{formatVnd(detail.subtotal)}</span>
                </div>
                <div className="flex justify-between w-60">
                  <span>Phí vận chuyển:</span>
                  <span className="text-gray-800">{formatVnd(detail.shippingFee)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-4 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
