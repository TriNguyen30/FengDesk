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
import { useTranslation } from "react-i18next";

export default function OrdersPage() {
  const { t } = useTranslation();
  const TABS = [
    { label: t("orders_page.tabs.all"), value: "" },
    { label: t("orders_page.tabs.pending"), value: "Pending" },
    { label: t("orders_page.tabs.paid"), value: "Paid" },
    { label: t("orders_page.tabs.processing"), value: "Processing" },
    { label: t("orders_page.tabs.shipping"), value: "Shipping" },
    { label: t("orders_page.tabs.completed"), value: "Completed" },
    { label: t("orders_page.tabs.cancelled"), value: "Cancelled" },
    { label: t("orders_page.tabs.expired"), value: "Expired" },
  ];

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">{t("orders_page.title")}</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {t("orders_page.subtitle")}
            </p>
          </div>
          {listStatus !== "loading" && (
            <p className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <strong className="text-gray-900">
                {activeTab ? filteredOrders.length : pagination.totalCount || 0}
              </strong>{" "}
              {t("orders_page.orders_count")}
            </p>
          )}
        </div>
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
                className={`relative flex-1 whitespace-nowrap px-5 py-4 text-center text-sm font-medium transition-colors cursor-pointer ${isActive ? "text-primary" : "text-gray-500 hover:text-gray-700"
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
            {t("orders_page.empty.message")} {activeTab && t("orders_page.empty.in_status")}
          </p>
          {!activeTab && (
            <Link
              to="/products"
              className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              {t("orders_page.empty.shop_now")}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusMeta = getOrderStatusMeta(order.status, order.paymentMethod);
            const items = (order as any).items || [];
            // Đơn có thể gồm hàng của nhiều store (mỗi store 1 delivery) → hiện store đầu + "+N".
            const stores = order.stores ?? [];
            const primaryStore = stores[0];
            const storeLabel = primaryStore?.storeName ?? t("orders_page.card.store_fallback");

            return (
              <div
                key={order.id}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{storeLabel}</span>
                    {stores.length > 1 && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                        +{stores.length - 1}
                      </span>
                    )}
                    <div className="hidden gap-1 sm:flex ml-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          dispatch(openChatbox({ isSupport: true }));
                        }}
                        className="flex items-center gap-1 rounded border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="h-3 w-3" /> {t("orders_page.card.chat")}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(primaryStore ? `/stores/${primaryStore.storeId}` : "/products");
                        }}
                        className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Store className="h-3 w-3" /> {t("orders_page.card.view_shop")}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    {order.status === "Completed" && (
                      <span className="hidden items-center gap-1 text-gray-400 sm:flex">
                        <Truck className="h-4 w-4" />
                        {t("orders_page.card.delivery_success")}
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
                              {t("orders_page.card.variant")} {item.variantName}
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
                          {t("orders_page.card.order_id")}{order.id.slice(0, 8).toUpperCase()}
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
                    <span className="text-sm text-gray-600">{t("orders_page.card.total")}</span>
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
                        {t("orders_page.actions.pay")}
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
                          // API /Review nhận productId (Product), KHÔNG phải productItemId (biến thể).
                          if (items.length > 0) setSelectedProductId(items[0].productId);
                          setRating(5);
                          setReviewContent("");
                        }}
                        className="flex-1 sm:flex-none rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark cursor-pointer"
                      >
                        {t("orders_page.actions.review")}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(openChatbox({ isSupport: true }));
                      }}
                      className="flex-1 sm:flex-none rounded-lg border border-gray-200 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                    >
                      {t("orders_page.actions.contact_seller")}
                    </button>
                    <Link
                      to={`/profile/orders/${order.id}`}
                      className="flex-1 sm:flex-none rounded-lg border border-gray-200 bg-white px-6 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                    >
                      {t("orders_page.actions.view_details")}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {pagination.totalPages > 1 && (
            <p className="pt-2 text-center text-xs text-gray-500">
              {t("orders_page.pagination", { page: pagination.page, total_pages: pagination.totalPages, total_count: pagination.totalCount })}
            </p>
          )}
        </div>
      )}

      {/* Payment QR Modal */}
      <PaymentQrModal orderId={payingOrderId} onClose={() => setPayingOrderId(null)} />

      {/* Review Modal */}
      <Modal
        open={reviewModal.open}
        title={t("orders_page.review_modal.title")}
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
      >
        <div className="flex flex-col gap-4">
          {reviewModal.items.length > 0 ? (
            <>
              {reviewModal.items.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("orders_page.review_modal.select_product")}
                  </label>
                  <select
                    className="w-full rounded border border-gray-300 p-2 text-sm"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {reviewModal.items.map((item: any) => (
                      <option key={item.id} value={item.productId}>
                        {item.productName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("orders_page.review_modal.your_rating")}
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
                  {t("orders_page.review_modal.review_content")}
                </label>
                <textarea
                  className="w-full rounded border border-gray-300 p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={4}
                  placeholder={t("orders_page.review_modal.placeholder")}
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
                  {t("orders_page.review_modal.cancel")}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedProductId) {
                      toast.error(t("orders_page.review_modal.toast.select_product"));
                      return;
                    }
                    if (!reviewContent.trim()) {
                      toast.error(t("orders_page.review_modal.toast.empty_content"));
                      return;
                    }
                    try {
                      setSubmittingReview(true);
                      await createReviewRequest({
                        productId: selectedProductId,
                        content: reviewContent,
                        rating,
                      });
                      toast.success(t("orders_page.review_modal.toast.success"));
                      setReviewModal({ ...reviewModal, open: false });
                    } catch (error: any) {
                      toast.error(error.message || t("orders_page.review_modal.toast.error"));
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                  className="flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark min-w-[100px]"
                  disabled={submittingReview}
                >
                  {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : t("orders_page.review_modal.submit")}
                </button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              {t("orders_page.review_modal.not_found")}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
