import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  Loader2,
  Search,
  Eye,
  X,
  Check,
  ExternalLink,
  Calendar,
  MapPin,
  Phone,
  User,
  DollarSign,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { getAllShopRequest } from "@/features/shop/api/shop.api";
import { useOrdersList, useUpdateOrderDeliveryStatus } from "@/features/orders";
import type { Order, OrderDetail } from "@/features/orders";
import { formatOrderDate, formatVnd } from "@/features/orders/utils/orderUtils";
import { ordersApi } from "@/features/orders";
import { STATUS_MAP } from "@/features/orders/utils/orderUtils";
import { useQueryClient } from "@tanstack/react-query";


const DELIVERY_STATUS_MAP: Record<string, { label: string; className: string }> = {
  Pending: { label: "Đang chờ", className: "bg-amber-50 text-amber-700 border-amber-200" },
  Confirmed: {
    label: "Đã xác nhận",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  Preparing: { label: "Đang chuẩn bị", className: "bg-blue-50 text-blue-700 border-blue-200" },
  Shipped: { label: "Đang giao hàng", className: "bg-blue-50 text-blue-700 border-blue-200" },
  Delivered: {
    label: "Đã giao hàng",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Cancelled: { label: "Đã hủy", className: "bg-red-50 text-red-700 border-red-200" },
  Returned: { label: "Đã trả hàng", className: "bg-red-50 text-red-700 border-red-200" },
};

const TABS = [
  { value: "All", label: "Tất cả" },
  { value: "Pending", label: "Đang chờ thanh toán" },
  { value: "Paid", label: "Đã thanh toán" },
  { value: "Processing", label: "Đang xử lý" },
  { value: "Completed", label: "Đã hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
  { value: "Expired", label: "Đã hết hạn" },
];

export default function ManageOrdersPage() {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Detailed Modal states
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { orders, listStatus } = useOrdersList({ page: 1, pageSize: 100 });
  const updateDeliveryStatusMutation = useUpdateOrderDeliveryStatus();
  const queryClient = useQueryClient();
  const handleStatusChange = async (deliveryId: string, newStatus: string) => {
    try {
      await updateDeliveryStatusMutation.mutateAsync({ deliveryId, data: { status: newStatus } });
      toast.success("Cập nhật trạng thái giao hàng thành công");
      
      // Invalidate cả list lẫn detail
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["order", selectedOrder?.id] });

      // Refetch lại detail để cập nhật modal
      if (selectedOrder) {
        const { data } = await ordersApi.getOrderById(selectedOrder.id);
        if (data.isSuccess && data.data) setSelectedOrder(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật trạng thái đơn hàng");
    }
  };

  // View order detail
  const handleViewDetail = async (orderId: string) => {
    setLoadingDetailId(orderId);
    try {
      const { data } = await ordersApi.getOrderById(orderId);
      if (data.isSuccess && data.data) {
        setSelectedOrder(data.data);
        setIsDetailModalOpen(true);
      } else {
        toast.error(data.message || "Không thể tải chi tiết đơn hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tải chi tiết đơn hàng");
    } finally {
      setLoadingDetailId(null);
    }
  };

  // Filter orders by active tab and search term
  const filteredOrders = orders.filter((order) => {
    // 1. Filter by Tab
    if (activeTab !== "All" && order.status !== activeTab) {
      return false;
    }
    // 2. Filter by Search (Order Code)
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      const codeMatch =
        order.orderCode?.toLowerCase().includes(search) || order.id.toLowerCase().includes(search);
      return codeMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý Đơn hàng</h1>
          <p className="text-gray-500 mt-1 text-sm">Xem và quản lý tất cả các đơn hàng.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs & Search controls */}
        <div className="border-b border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${activeTab === tab.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                {tab.label}
                {activeTab !== tab.value &&
                  orders.filter((d) => tab.value === "All" || d.status === tab.value).length >
                  0 && (
                    <span className="ml-1.5 rounded-full bg-gray-200/60 px-1.5 py-0.2 text-[10px] text-gray-600 font-medium">
                      {orders.filter((d) => tab.value === "All" || d.status === tab.value).length}
                    </span>
                  )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, sđt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Table Content ────────────────────────────────────────────────── */}
        {listStatus === "loading" && filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-900">Không tìm thấy đơn hàng nào</h3>
            <p className="text-sm text-gray-500 mt-1">
              Vui lòng kiểm tra lại bộ lọc hoặc điều kiện tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 w-28">Mã đơn</th>
                  <th className="p-4 w-32">Ngày đặt</th>
                  <th className="p-4 w-32">Phương thức</th>
                  <th className="p-4 w-32">Tổng tiền</th>
                  <th className="p-4 w-44">Trạng thái thanh toán</th>
                  <th className="p-4 w-24 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const statusMeta = STATUS_MAP[order.status] || {
                    label: order.status,
                    className: "bg-gray-100 text-gray-700 border-gray-200",
                  };

                  const isDetailLoading = loadingDetailId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                      {/* Order Code */}
                      <td className="p-4 font-mono font-bold text-gray-900">
                        {order.orderCode ? `#${order.orderCode}` : `#${order.id.substring(0, 8)}`}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatOrderDate(order.createdAt)}
                      </td>

                      {/* Payment Method */}
                      <td className="p-4">
                        <p className="font-semibold text-gray-900">{order.paymentMethod}</p>
                      </td>

                      {/* Total Amount */}
                      <td className="p-4 font-bold text-gray-900 whitespace-nowrap">
                        {formatVnd(order.totalAmount || 0)}
                      </td>

                      {/* Payment Status */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* View Actions */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleViewDetail(order.id)}
                          disabled={isDetailLoading}
                          title="Xem chi tiết đơn hàng"
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isDetailLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ───────────────────────────────────────────────────── */}
{isDetailModalOpen && selectedOrder && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
    <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wide">
            Chi tiết đơn hàng
          </span>
          <h3 className="text-lg font-bold text-gray-900 mt-0.5">
            #{selectedOrder.id.substring(0, 8).toUpperCase()}
          </h3>
        </div>
        <button
          onClick={() => setIsDetailModalOpen(false)}
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Modal Body */}
      <div className="px-6 py-5 max-h-[75vh] overflow-y-auto space-y-5 text-sm">

        {/* ── Thông tin chung ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/40">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Thời gian đặt</p>
              <p className="font-semibold text-gray-800 mt-0.5 text-xs">
                {formatOrderDate(selectedOrder.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/40">
            <DollarSign className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Phương thức thanh toán</p>
              <p className="font-semibold text-gray-800 mt-0.5 text-xs">
                {selectedOrder.paymentMethod === "COD"
                  ? "Thanh toán khi nhận hàng (COD)"
                  : selectedOrder.paymentMethod}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/40">
            <Tag className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Trạng thái thanh toán</p>
              <span className={`inline-block mt-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                STATUS_MAP[selectedOrder.status]?.className ?? "bg-gray-100 text-gray-700 border-gray-200"
              }`}>
                {STATUS_MAP[selectedOrder.status]?.label ?? selectedOrder.status}
              </span>
            </div>
          </div>
        </div>

        {/* ── Ghi chú ── */}
        {selectedOrder.note && (
          <div className="border border-amber-100 rounded-xl p-4 bg-amber-50/20 text-xs">
            <h4 className="font-bold text-amber-800 mb-1">Ghi chú của khách hàng</h4>
            <p className="text-amber-700 italic leading-relaxed">{selectedOrder.note}</p>
          </div>
        )}

        {/* ── Sản phẩm ── */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Sản phẩm đặt mua
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
                {selectedOrder.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30">
                    <td className="p-3">
                      <p className="font-semibold text-gray-800">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Phân loại: {item.variantName}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-center text-gray-700 font-medium">{item.quantity}</td>
                    <td className="p-3 text-right text-gray-600">{formatVnd(item.unitPrice)}</td>
                    <td className="p-3 text-right font-bold text-gray-800">{formatVnd(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Deliveries ── */}
        {selectedOrder.deliveries && selectedOrder.deliveries.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Thông tin giao hàng
            </h4>
            <div className="space-y-3">
              {selectedOrder.deliveries.map((delivery) => (
                <div key={delivery.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/20 space-y-3">
                  {/* Store + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold text-gray-800 text-xs">{delivery.storeName}</span>
                    </div>
                    <select
                      value={delivery.status}
                      onChange={(e) => handleStatusChange(delivery.id, e.target.value)}
                      disabled={updateDeliveryStatusMutation.isPending}
                      className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                        DELIVERY_STATUS_MAP[delivery.status]?.className ?? "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {Object.entries(DELIVERY_STATUS_MAP).map(([key, meta]) => (
                        <option key={key} value={key}>{meta.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs text-gray-500">
                    <div>
                      <p className="text-gray-400">Phí ship</p>
                      <p className="font-semibold text-gray-700">{formatVnd(delivery.shippingFee)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Tạm tính</p>
                      <p className="font-semibold text-gray-700">{formatVnd(delivery.subtotal)}</p>
                    </div>
                    {delivery.trackingCode && (
                      <div>
                        <p className="text-gray-400">Mã vận đơn</p>
                        <p className="font-semibold text-gray-700 font-mono">{delivery.trackingCode}</p>
                      </div>
                    )}
                    {delivery.shippingProvider && (
                      <div>
                        <p className="text-gray-400">Đơn vị vận chuyển</p>
                        <p className="font-semibold text-gray-700">{delivery.shippingProvider}</p>
                      </div>
                    )}
                    {delivery.estimatedDeliveryDate && (
                      <div>
                        <p className="text-gray-400">Dự kiến giao</p>
                        <p className="font-semibold text-gray-700">
                          {formatOrderDate(delivery.estimatedDeliveryDate)}
                        </p>
                      </div>
                    )}
                    {delivery.shippedAt && (
                      <div>
                        <p className="text-gray-400">Đã gửi lúc</p>
                        <p className="font-semibold text-gray-700">{formatOrderDate(delivery.shippedAt)}</p>
                      </div>
                    )}
                    {delivery.deliveredAt && (
                      <div>
                        <p className="text-gray-400">Giao thành công</p>
                        <p className="font-semibold text-gray-700">{formatOrderDate(delivery.deliveredAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Status Logs ── */}
        {selectedOrder.statusLogs && selectedOrder.statusLogs.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Lịch sử trạng thái
            </h4>
            <div className="relative border border-gray-100 rounded-xl p-4 bg-gray-50/20 space-y-3">
              {selectedOrder.statusLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0 ring-2 ring-primary/20" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {log.fromStatus && (
                        <>
                          <span className="text-gray-400 font-medium">
                            {STATUS_MAP[log.fromStatus]?.label ?? log.fromStatus}
                          </span>
                          <span className="text-gray-300">→</span>
                        </>
                      )}
                      <span className="font-semibold text-gray-700">
                        {STATUS_MAP[log.toStatus]?.label ?? log.toStatus}
                      </span>
                    </div>
                    {log.note && <p className="text-gray-400 mt-0.5 italic">{log.note}</p>}
                  </div>
                  <span className="text-gray-400 whitespace-nowrap shrink-0">
                    {formatOrderDate(log.changedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tổng tiền ── */}
        <div className="flex flex-col items-end gap-1.5 border-t border-gray-100 pt-4 text-xs font-semibold text-gray-500">
          <div className="flex justify-between w-60">
            <span>Tạm tính:</span>
            <span className="text-gray-800">{formatVnd(selectedOrder.subtotal)}</span>
          </div>
          <div className="flex justify-between w-60">
            <span>Phí vận chuyển:</span>
            <span className="text-gray-800">{formatVnd(selectedOrder.totalShippingFee ?? 0)}</span>
          </div>
          <div className="flex justify-between w-60 border-t border-dashed border-gray-200 pt-2 text-sm font-bold">
            <span className="text-gray-900">Tổng thanh toán:</span>
            <span className="text-primary">{formatVnd(selectedOrder.totalAmount)}</span>
          </div>
        </div>

      </div>

      {/* Modal Footer */}
      <div className="flex justify-end border-t border-gray-100 px-6 py-4 bg-gray-50/50">
        <button
          type="button"
          onClick={() => setIsDetailModalOpen(false)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
