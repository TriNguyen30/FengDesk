import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, Loader2, Search, Eye, X, Check, ExternalLink, Calendar, MapPin, Phone, User, DollarSign, Tag } from "lucide-react";
import { toast } from "sonner";
import { getAllShopRequest } from "@/features/shop/api/shop.api";
import type { Shop } from "@/features/shop/types/shop";
import { useOrders } from "@/features/orders";
import type { Delivery, OrderDetail } from "@/features/orders";
import { formatOrderDate, formatVnd } from "@/features/orders/utils/orderUtils";
import { ordersApi } from "@/features/orders";

const DELIVERY_STATUS_MAP: Record<string, { label: string; className: string }> = {
  Pending: { label: "Chờ lấy hàng", className: "bg-amber-50 text-amber-700 border-amber-200" },
  PickedUp: { label: "Đã lấy hàng", className: "bg-blue-50 text-blue-700 border-blue-200" },
  InTransit: { label: "Đang giao hàng", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  Delivered: { label: "Đã giao hàng", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Cancelled: { label: "Đã hủy", className: "bg-red-50 text-red-700 border-red-200" },
};

const TABS = [
  { value: "All", label: "Tất cả" },
  { value: "Pending", label: "Chờ lấy hàng" },
  { value: "PickedUp", label: "Đã lấy hàng" },
  { value: "InTransit", label: "Đang giao hàng" },
  { value: "Delivered", label: "Đã giao hàng" },
  { value: "Cancelled", label: "Đã hủy" },
];

export default function ManageOrdersPage() {
  const {
    deliveries,
    deliveriesStatus,
    getStoreDeliveries,
    changeDeliveryStatus,
  } = useOrders();

  const [stores, setStores] = useState<Shop[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Detailed Modal states
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch all stores managed by manager
  useEffect(() => {
    getAllShopRequest()
      .then((res) => {
        if (res.isSuccess && res.data) {
          setStores(res.data);
          if (res.data.length > 0) {
            setSelectedStoreId(res.data[0].id);
          }
        } else {
          toast.error("Không thể tải danh sách cửa hàng");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Đã xảy ra lỗi khi tải danh sách cửa hàng");
      });
  }, []);

  // Fetch store deliveries when selected store changes
  const fetchDeliveries = useCallback(() => {
    if (selectedStoreId) {
      getStoreDeliveries(selectedStoreId, { page: 1, pageSize: 100 });
    }
  }, [selectedStoreId, getStoreDeliveries]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Handle updating delivery status
  const handleStatusChange = async (deliveryId: string, newStatus: string) => {
    try {
      await changeDeliveryStatus(deliveryId, { status: newStatus }, selectedStoreId);
      toast.success("Cập nhật trạng thái đơn hàng thành công");
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật trạng thái đơn hàng");
    }
  };

  // View order detail
  const handleViewDetail = async (orderId: string) => {
    setLoadingDetailId(orderId);
    try {
      const response = await ordersApi.getOrderById(orderId);
      if (response.isSuccess && response.data) {
        setSelectedOrder(response.data);
        setIsDetailModalOpen(true);
      } else {
        toast.error(response.message || "Không thể tải chi tiết đơn hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tải chi tiết đơn hàng");
    } finally {
      setLoadingDetailId(null);
    }
  };

  // Filter deliveries by active tab and search term
  const filteredDeliveries = deliveries.filter((delivery) => {
    // 1. Filter by Tab
    if (activeTab !== "All" && delivery.status !== activeTab) {
      return false;
    }
    // 2. Filter by Search (Order Code, Customer Name, Recipient Phone)
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      const codeMatch = delivery.orderCode?.toLowerCase().includes(search) || delivery.orderId.toLowerCase().includes(search);
      const nameMatch = delivery.customerName?.toLowerCase().includes(search);
      const phoneMatch = delivery.recipientPhone?.includes(search);
      return codeMatch || nameMatch || phoneMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Store dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý Đơn hàng</h1>
          <p className="text-gray-500 mt-1 text-sm">Xem và quản lý các đơn vận chuyển của cửa hàng.</p>
        </div>

        {stores.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 shrink-0">Cửa hàng:</span>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {stores.length === 0 && deliveriesStatus !== "loading" ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center shadow-sm">
          <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-600 font-medium">Bạn chưa được phân quyền quản lý cửa hàng nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs & Search controls */}
          <div className="border-b border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab.value
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                  {activeTab !== tab.value && deliveries.filter(d => tab.value === "All" || d.status === tab.value).length > 0 && (
                    <span className="ml-1.5 rounded-full bg-gray-200/60 px-1.5 py-0.2 text-[10px] text-gray-600 font-medium">
                      {deliveries.filter(d => tab.value === "All" || d.status === tab.value).length}
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
          {deliveriesStatus === "loading" && filteredDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Đang tải danh sách đơn hàng...</p>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-base font-semibold text-gray-900">Không tìm thấy đơn hàng nào</h3>
              <p className="text-sm text-gray-500 mt-1">Vui lòng kiểm tra lại bộ lọc hoặc điều kiện tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 w-28">Mã đơn</th>
                    <th className="p-4 w-40">Khách hàng</th>
                    <th className="p-4 w-60">Địa chỉ giao hàng</th>
                    <th className="p-4 w-32">Ngày đặt</th>
                    <th className="p-4 w-32">Tổng tiền</th>
                    <th className="p-4 w-44">Trạng thái vận chuyển</th>
                    <th className="p-4 w-24 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDeliveries.map((delivery) => {
                    const statusMeta = DELIVERY_STATUS_MAP[delivery.status] || {
                      label: delivery.status,
                      className: "bg-gray-100 text-gray-700 border-gray-200",
                    };

                    const isDetailLoading = loadingDetailId === delivery.orderId;

                    return (
                      <tr key={delivery.id} className="hover:bg-gray-50/30 transition-colors">
                        {/* Order Code */}
                        <td className="p-4 font-mono font-bold text-gray-900">
                          {delivery.orderCode ? `#${delivery.orderCode}` : `#${delivery.orderId.substring(0, 8)}`}
                        </td>

                        {/* Customer details */}
                        <td className="p-4">
                          <p className="font-semibold text-gray-900">{delivery.customerName || "Khách hàng"}</p>
                          {delivery.recipientPhone && (
                            <p className="text-xs text-gray-400 font-medium mt-0.5">{delivery.recipientPhone}</p>
                          )}
                        </td>

                        {/* Shipping Address */}
                        <td className="p-4">
                          <p className="text-gray-600 line-clamp-2 leading-relaxed text-xs">
                            {delivery.shippingAddress || "Đang cập nhật"}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                          {formatOrderDate(delivery.createdAt)}
                        </td>

                        {/* Total Amount */}
                        <td className="p-4 font-bold text-gray-900 whitespace-nowrap">
                          {formatVnd(delivery.totalAmount || 0)}
                        </td>

                        {/* Interactive Status Selector */}
                        <td className="p-4">
                          <select
                            value={delivery.status}
                            onChange={(e) => handleStatusChange(delivery.id, e.target.value)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${statusMeta.className}`}
                          >
                            <option value="Pending">Chờ lấy hàng</option>
                            <option value="PickedUp">Đã lấy hàng</option>
                            <option value="InTransit">Đang giao hàng</option>
                            <option value="Delivered">Đã giao hàng</option>
                            <option value="Cancelled">Đã hủy</option>
                          </select>
                        </td>

                        {/* View Actions */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleViewDetail(delivery.orderId)}
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
      )}

      {/* ── DETAIL MODAL ───────────────────────────────────────────────────── */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wide">Chi tiết đơn hàng</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  Đơn hàng {selectedOrder.orderCode ? `#${selectedOrder.orderCode}` : ""}
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
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-6 text-sm">
              {/* Order Metadata info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Order Date */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/30">
                  <Calendar className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Thời gian đặt</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{formatOrderDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/30">
                  <DollarSign className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Phương thức thanh toán</p>
                    <p className="font-semibold text-gray-800 mt-0.5">
                      {selectedOrder.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : selectedOrder.paymentMethod}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/30">
                  <Tag className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Trạng thái chung</p>
                    <p className="font-semibold mt-0.5">
                      {selectedOrder.status === "Pending" && selectedOrder.paymentMethod === "COD"
                        ? "Chờ xác nhận"
                        : selectedOrder.status === "Paid"
                        ? "Đã thanh toán"
                        : selectedOrder.status === "Processing"
                        ? "Đang xử lý"
                        : selectedOrder.status === "Completed"
                        ? "Đã hoàn thành"
                        : selectedOrder.status === "Cancelled"
                        ? "Đã hủy"
                        : selectedOrder.status === "Expired"
                        ? "Đã hết hạn"
                        : selectedOrder.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recipient / Delivery Info */}
              {selectedOrder.shippingAddress && (
                <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/10">
                  <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" /> Thông tin nhận hàng
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <p className="text-gray-500 flex items-center gap-1.5">
                      <User size={13} />
                      Người nhận: <span className="font-semibold text-gray-800">{selectedOrder.shippingAddress.recipientName}</span>
                    </p>
                    <p className="text-gray-500 flex items-center gap-1.5">
                      <Phone size={13} />
                      Số điện thoại: <span className="font-semibold text-gray-800">{selectedOrder.shippingAddress.recipientPhone}</span>
                    </p>
                    <p className="text-gray-500 flex items-start gap-1.5 sm:col-span-2">
                      <MapPin size={13} className="shrink-0 mt-0.5" />
                      Địa chỉ:{" "}
                      <span className="font-medium text-gray-800 leading-relaxed">
                        {selectedOrder.shippingAddress.streetAddress}
                        {selectedOrder.shippingAddress.wardName ? `, ${selectedOrder.shippingAddress.wardName}` : ""}
                        {selectedOrder.shippingAddress.districtName ? `, ${selectedOrder.shippingAddress.districtName}` : ""}
                        {selectedOrder.shippingAddress.provinceName ? `, ${selectedOrder.shippingAddress.provinceName}` : ""}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              {selectedOrder.note && (
                <div className="border border-amber-100 rounded-xl p-4 bg-amber-50/20 text-xs">
                  <h4 className="font-bold text-amber-800 mb-1">Ghi chú của khách hàng</h4>
                  <p className="text-amber-700 italic leading-relaxed">{selectedOrder.note}</p>
                </div>
              )}

              {/* Line Items Table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-600">
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3 w-24 text-center">Số lượng</th>
                      <th className="p-3 w-28 text-right">Đơn giá</th>
                      <th className="p-3 w-32 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/20">
                        {/* Product Detail */}
                        <td className="p-3 flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="h-10 w-10 rounded-lg object-contain border border-gray-100 bg-gray-50"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 border border-gray-100">
                              <ShoppingBag size={16} />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{item.productName}</p>
                            {item.variantName && (
                              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Phân loại: {item.variantName}</p>
                            )}
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="p-3 text-center text-gray-700 font-medium">
                          {item.quantity}
                        </td>

                        {/* Unit Price */}
                        <td className="p-3 text-right text-gray-600 font-medium">
                          {formatVnd(item.unitPrice)}
                        </td>

                        {/* Line Total */}
                        <td className="p-3 text-right font-bold text-gray-800">
                          {formatVnd(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals */}
              <div className="flex flex-col items-end gap-2 border-t border-gray-100 pt-4 text-xs font-semibold text-gray-500">
                <div className="flex justify-between w-64">
                  <span>Tạm tính:</span>
                  <span className="text-gray-800">{formatVnd(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.shippingFee !== undefined && (
                  <div className="flex justify-between w-64">
                    <span>Phí vận chuyển:</span>
                    <span className="text-gray-800">{formatVnd(selectedOrder.shippingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 border-t border-dashed border-gray-200 pt-2 text-sm font-bold">
                  <span className="text-gray-900">Tổng thanh toán:</span>
                  <span className="text-primary">{formatVnd(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
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
