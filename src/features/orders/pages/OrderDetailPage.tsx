import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useAppDispatch } from "@/store/hooks";
import { cancelOrder } from "../store/orderSlice";
import { useOrders } from "../hooks/useOrders";
import { formatOrderDate, formatVnd, getOrderStatusMeta } from "../utils/orderUtils";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentOrder, detailStatus, getOrderById, clearOrder } = useOrders();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) getOrderById(id);
    return () => clearOrder();
  }, [id, getOrderById, clearOrder]);

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      const result = await dispatch(cancelOrder(id)).unwrap();
      if (result.data.isSuccess) {
        toast.success("Đã hủy đơn hàng");
        setIsCancelModalOpen(false);
      } else {
        toast.error(result.data.message || "Không thể hủy đơn hàng");
      }
    } catch {
      toast.error("Không thể hủy đơn hàng");
    } finally {
      setCancelling(false);
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
        <Link to="/profile/orders" className="mt-4 text-sm font-medium text-primary hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const order = currentOrder;
  const statusMeta = getOrderStatusMeta(order.status);
  const canCancel = !["Cancelled", "Delivered", "Shipping"].includes(order.status);

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
            {order.orderCode ? `Đơn #${order.orderCode}` : "Chi tiết đơn hàng"}
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
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {item.productName}
                      {item.variantName ? ` (${item.variantName})` : ""}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatVnd(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-gray-900">{formatVnd(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>

          {order.shippingAddress && (
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
                <MapPin className="h-5 w-5 text-primary" />
                Địa chỉ giao hàng
              </h2>
              <p className="font-medium text-gray-900">
                {order.shippingAddress.recipientName} · {order.shippingAddress.recipientPhone}
              </p>
              <p className="mt-1 text-sm text-gray-600">{order.shippingAddress.streetAddress}</p>
              {(order.shippingAddress.wardName || order.shippingAddress.provinceName) && (
                <p className="mt-1 text-sm text-gray-500">
                  {[order.shippingAddress.wardName, order.shippingAddress.districtName, order.shippingAddress.provinceName]
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
                <span>{order.shippingFee != null ? formatVnd(order.shippingFee) : "Chưa tính"}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatVnd(order.totalAmount)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Phương thức: {order.paymentMethod}
              {order.paymentStatus ? ` · ${order.paymentStatus}` : ""}
            </p>
          </section>

          {order.paymentUrl && order.status === "Pending" && (
            <a
              href={order.paymentUrl}
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark"
            >
              Thanh toán ngay
            </a>
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

      <Modal open={isCancelModalOpen} title="Hủy đơn hàng" onClose={() => setIsCancelModalOpen(false)}>
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
