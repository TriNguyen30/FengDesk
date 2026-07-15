import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Loader2, Package, MessageCircle, Store, Truck, Star } from "lucide-react";
import { useOrdersList } from "../hooks/useOrders";
import { formatOrderDate, formatVnd, getOrderStatusMeta } from "../utils/orderUtils";
import { useAppDispatch } from "@/app/store";
import { openChatbox } from "@/features/chatbox/store/chatboxSlice";
import Modal from "@/components/ui/Modal";
import { createReviewRequest } from "@/features/review/api/review.api";
import { toast } from "sonner";
import { ordersApi } from "../api/orders.api";
import PaymentQrModal from "@/features/payment/components/PaymentQrModal";

const TABS = [
  { label: "Tất cả", value: "" },
  { label: "Đang chờ", value: "Pending" },
  { label: "Đã thanh toán", value: "Paid" },
  { label: "Đang xử lý", value: "Processing" },
  { label: "Đã hoàn thành", value: "Completed" },
  { label: "Đã hủy", value: "Cancelled" },
  { label: "Đã hết hạn", value: "Expired" },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("");
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    orderId: string | null;
    items: any[];
  }>({ open: false, orderId: null, items: [] });
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  // Đơn Pending/PayOS chưa trả tiền → mở modal QR + link thanh toán ngay từ danh sách.
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const { orders, listStatus, pagination } = useOrdersList({
    page: 1,
    pageSize: 20,
    status: activeTab || undefined,
  });

  const filteredOrders = activeTab ? orders.filter((order) => order.status === activeTab) : orders;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
        {listStatus !== "loading" && (
          <p className="mt-1 text-sm text-gray-500 font-medium">
            <strong className="text-gray-900">
              {activeTab ? filteredOrders.length : pagination.totalCount || 0}
            </strong>{" "}
            đơn hàng
          </p>
        )}
      </div>

      {/* Tabs Scroll */}
      <div
        className="mb-6 w-full overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex w-full min-w-max px-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative flex-1 whitespace-nowrap px-5 py-4 text-center text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? "text-primary" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {listStatus === "loading" ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center bg-white">
          <Package className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-600">
            Bạn chưa có đơn hàng nào {activeTab && "ở trạng thái này"}
          </p>
          {!activeTab && (
            <Link
              to="/products"
              className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Mua sắm ngay
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusMeta = getOrderStatusMeta(order.status, order.paymentMethod);
            const items = (order as any).items || [];

            return (
              <div
                key={order.id}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">FengShuiGarden</span>
                    <div className="hidden gap-1 sm:flex ml-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          dispatch(openChatbox({ isSupport: true }));
                        }}
                        className="flex items-center gap-1 rounded border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="h-3 w-3" /> Chat
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const orderItems = (order as any).items || [];
                          const deliveries = (order as any).deliveries || [];
                          const storeId =
                            orderItems[0]?.gardenStoreId ||
                            orderItems[0]?.storeId ||
                            deliveries[0]?.storeId;
                          if (storeId) {
                            navigate(`/stores/${storeId}`);
                          } else {
                            navigate("/products");
                          }
                        }}
                        className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Store className="h-3 w-3" /> Xem Shop
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    {order.status === "Completed" && (
                      <span className="hidden items-center gap-1 text-gray-400 sm:flex">
                        <Truck className="h-4 w-4" />
                        Giao hàng thành công
                      </span>
                    )}
                    {order.status === "Completed" && (
                      <span className="hidden text-gray-300 sm:block">|</span>
                    )}
                    <span
                      className={`font-bold uppercase ${statusMeta.className.split(" ").find((c: string) => c.startsWith("text-")) || "text-primary"}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                </div>

                {/* Body (Items or Fallback) */}
                <Link
                  to={`/profile/orders/${order.id}`}
                  className="flex flex-col gap-0 p-4 sm:px-6 hover:bg-gray-50/50 transition-colors"
                >
                  {items.length > 0 ? (
                    items.map((item: any, idx: number) => (
                      <div
                        key={item.id || idx}
                        className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0 last:pb-0 first:pt-0"
                      >
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded border border-gray-100 bg-gray-50">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                        <div className="flex flex-1 flex-col min-w-0">
                          <p className="text-sm text-gray-900 line-clamp-2">{item.productName}</p>
                          {item.variantName && (
                            <p className="mt-1 text-xs text-gray-500">
                              Phân loại hàng: {item.variantName}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-medium text-gray-900">x{item.quantity}</p>
                        </div>
                        <div className="flex items-center justify-end gap-2 ml-4">
                          <span className="text-sm font-medium text-primary">
                            {formatVnd(item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Fallback
                    <div className="flex items-center gap-4 py-2">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-gray-100 bg-green-50">
                        <Package className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">
                          Đơn hàng #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </Link>

                {/* Footer */}
                <div className="flex flex-col items-end gap-4 border-t border-gray-50 bg-gray-50/30 px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Thành tiền:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatVnd(order.totalAmount)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                    {order.status === "Pending" && order.paymentMethod === "PayOS" && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setPayingOrderId(order.id);
                        }}
                        className="flex-1 sm:flex-none rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark cursor-pointer"
                      >
                        Thanh Toán
                      </button>
                    )}
                    {order.status === "Completed" && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          let items = (order as any).items || [];
                          if (items.length === 0) {
                            try {
                              const res = await ordersApi.getOrderById(order.id);
                              if (res.data?.data?.items) {
                                items = res.data.data.items;
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }
                          setReviewModal({ open: true, orderId: order.id, items });
                          if (items.length > 0)
                            setSelectedProductId(items[0].productItemId || items[0].productId);
                          setRating(5);
                          setReviewContent("");
                        }}
                        className="flex-1 sm:flex-none rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark cursor-pointer"
                      >
                        Đánh Giá
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(openChatbox({ isSupport: true }));
                      }}
                      className="flex-1 sm:flex-none rounded-lg border border-gray-200 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                    >
                      Liên Hệ Người Bán
                    </button>
                    <Link
                      to={`/profile/orders/${order.id}`}
                      className="flex-1 sm:flex-none rounded-lg border border-gray-200 bg-white px-6 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                    >
                      Xem Chi Tiết
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {pagination.totalPages > 1 && (
            <p className="pt-2 text-center text-xs text-gray-500">
              Trang {pagination.page}/{pagination.totalPages} · {pagination.totalCount} đơn hàng
            </p>
          )}
        </div>
      )}

      {/* Payment QR Modal */}
      <PaymentQrModal orderId={payingOrderId} onClose={() => setPayingOrderId(null)} />

      {/* Review Modal */}
      <Modal
        open={reviewModal.open}
        title="Đánh giá sản phẩm"
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
      >
        <div className="flex flex-col gap-4">
          {reviewModal.items.length > 0 ? (
            <>
              {reviewModal.items.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn sản phẩm
                  </label>
                  <select
                    className="w-full rounded border border-gray-300 p-2 text-sm"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {reviewModal.items.map((item: any) => (
                      <option key={item.id} value={item.productItemId || item.productId}>
                        {item.productName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đánh giá của bạn
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 cursor-pointer ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung đánh giá
                </label>
                <textarea
                  className="w-full rounded border border-gray-300 p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={4}
                  placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ ...reviewModal, open: false })}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={submittingReview}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedProductId) {
                      toast.error("Vui lòng chọn sản phẩm để đánh giá");
                      return;
                    }
                    if (!reviewContent.trim()) {
                      toast.error("Vui lòng nhập nội dung đánh giá");
                      return;
                    }
                    try {
                      setSubmittingReview(true);
                      await createReviewRequest({
                        productId: selectedProductId,
                        content: reviewContent,
                        rating,
                      });
                      toast.success("Đánh giá sản phẩm thành công!");
                      setReviewModal({ ...reviewModal, open: false });
                    } catch (error: any) {
                      toast.error(error.message || "Không thể gửi đánh giá lúc này");
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                  className="flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark min-w-[100px]"
                  disabled={submittingReview}
                >
                  {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi Đánh Giá"}
                </button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              Không tìm thấy thông tin sản phẩm để đánh giá.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
