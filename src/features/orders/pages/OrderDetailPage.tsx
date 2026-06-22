import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useOrderDetail, useCancelOrder } from "../hooks/useOrders";
import { formatOrderDate, formatVnd, getOrderStatusMeta } from "../utils/orderUtils";
import { paymentApi } from "@/features/payment";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, detailStatus } = useOrderDetail(id);
  const cancelOrderMutation = useCancelOrder();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      await cancelOrderMutation.mutateAsync(id);
      toast.success("Đã hủy đơn hàng");
      setIsCancelModalOpen(false);
    } catch {
      toast.error("Không thể hủy đơn hàng");
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const paymentRes = await paymentApi.createPayment(order.id);
      if (paymentRes.data.isSuccess && paymentRes.data.data.checkoutUrl) {
        localStorage.setItem("pending_payment_order_id", order.id);
        window.location.href = paymentRes.data.data.checkoutUrl;
      } else {
        toast.error(paymentRes.data.message || "Không thể tạo liên kết thanh toán");
      }
    } catch {
      toast.error("Lỗi khi kết nối tới cổng thanh toán");
    } finally {
      setPaying(false);
    }
  };

  if (detailStatus === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (detailStatus === "failed" || !currentOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-gray-600">Không tìm thấy đơn hàng</p>
        <Link
          to="/profile/orders"
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const order = currentOrder;
  const statusMeta = getOrderStatusMeta(order.status, order.paymentMethod);
  const canCancel = !["Cancelled", "Completed", "Expired"].includes(order.status);

  return (
    <div>
      <button
        onClick={() => navigate("/profile/orders")}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh sách
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Đơn #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Đặt lúc {formatOrderDate(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusMeta.className}`}>
          {statusMeta.label}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Sản phẩm</h2>
            <ul className="divide-y divide-gray-100">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-100">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatVnd(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-gray-900">
                    {formatVnd(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {(order as any).shippingAddress && (
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
                <MapPin className="h-5 w-5 text-primary" />
                Địa chỉ giao hàng
              </h2>
              <p className="font-medium text-gray-900">
                {(order as any).shippingAddress?.recipientName} · {(order as any).shippingAddress?.recipientPhone}
              </p>
              <p className="mt-1 text-sm text-gray-600">{(order as any).shippingAddress?.streetAddress}</p>
              {(order as any).shippingAddress && (order as any).shippingAddress.wardName && (
                <p className="mt-1 text-sm text-gray-500">
                  {[
                    (order as any).shippingAddress.wardName,
                    (order as any).shippingAddress.districtName,
                    (order as any).shippingAddress.provinceName,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </section>
          )}

          {order.note && (
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Ghi chú</h2>
              <p className="text-sm text-gray-600">{order.note}</p>
            </section>
          )}
        </div>

        <aside className="h-fit space-y-4">
          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Thanh toán</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{formatVnd(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>
                  {order.totalShippingFee != null ? formatVnd(order.totalShippingFee) : "Chưa tính"}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatVnd(order.totalAmount)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Phương thức: {order.paymentMethod}
            </p>
          </section>

          {order.paymentMethod === "PayOS" && order.status === "Pending" && (
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Thanh toán ngay"
              )}
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
            >
              Hủy đơn hàng
            </button>
          )}
        </aside>
      </div>

      <Modal
        open={isCancelModalOpen}
        title="Hủy đơn hàng"
        onClose={() => setIsCancelModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Bạn có chắc chắn muốn hủy đơn hàng này?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Không
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
            >
              {cancelling ? "Đang hủy..." : "Hủy đơn"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
