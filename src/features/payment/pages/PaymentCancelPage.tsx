import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { RefreshCw, ChevronRight, ShoppingBag, FileText, Loader2, Ban } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { usePayment } from "../hooks/usePayment";
import { useOrders } from "@/features/orders/hooks/useOrders";

export default function PaymentCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryOrderCode = searchParams.get("orderCode");

  const { paymentStatus, status, getPaymentStatus, createPayment, cancelPayment, simulatePaid } =
    usePayment();
  const { currentOrder, getOrderById, getOrders, cancelOrderById } = useOrders();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [searchingOrder, setSearchingOrder] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const hasLoadedRef = useRef(false);

  // 1. Resolve orderId from localStorage or queryOrderCode
  useEffect(() => {
    const cachedOrderId = localStorage.getItem("pending_payment_order_id");
    if (cachedOrderId) {
      setOrderId(cachedOrderId);
    } else if (queryOrderCode) {
      setSearchingOrder(true);
      getOrders({ pageSize: 50 })
        .unwrap()
        .then((res) => {
          if (res.data.isSuccess && res.data.data && res.data.data.items) {
            const found = res.data.data.items.find(
              (o: any) => String(o.orderCode) === String(queryOrderCode),
            );
            if (found) {
              setOrderId(found.id);
            } else {
              toast.error("Không tìm thấy đơn hàng tương ứng");
            }
          }
        })
        .catch(() => {
          toast.error("Lỗi khi tìm kiếm thông tin đơn hàng");
        })
        .finally(() => {
          setSearchingOrder(false);
        });
    } else {
      toast.error("Thiếu thông tin đơn hàng thanh toán");
    }
  }, [queryOrderCode, getOrders]);

  // 2. Fetch order details & payment status once orderId is resolved
  useEffect(() => {
    if (orderId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      getOrderById(orderId);
      getPaymentStatus(orderId);
    }
  }, [orderId, getOrderById, getPaymentStatus]);

  // Retry Payment: recreate PayOS payment link and redirect
  const handleRetryPayment = async () => {
    if (!orderId) return;
    setRetrying(true);
    try {
      // Create new payment link
      const result = await createPayment(orderId).unwrap();
      if (result.isSuccess && result.data && result.data.checkoutUrl) {
        localStorage.setItem("pending_payment_order_id", orderId);
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(result.message || "Không thể tạo lại liên kết thanh toán");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tạo liên kết thanh toán");
    } finally {
      setRetrying(false);
    }
  };

  // Cancel Order: Cancel the order & transaction
  const handleCancelOrder = async () => {
    if (!orderId) return;
    setCancelling(true);
    try {
      // Cancel payment in payments controller
      await cancelPayment(orderId, { reason: "Người dùng hủy tại trang thanh toán" }).unwrap();
      // Cancel order in orders store
      const result = await cancelOrderById(orderId).unwrap();
      if (result.data.isSuccess) {
        toast.success("Đã hủy đơn hàng thành công");
        getOrderById(orderId);
        getPaymentStatus(orderId);
        localStorage.removeItem("pending_payment_order_id");
      } else {
        toast.error(result.data.message || "Không thể hủy đơn hàng");
      }
    } catch {
      toast.error("Lỗi khi thực hiện hủy đơn hàng");
    } finally {
      setCancelling(false);
    }
  };

  // Developer simulation helper
  const handleSimulatePaid = async () => {
    if (!orderId) return;
    setSimulating(true);
    try {
      const result = await simulatePaid(orderId).unwrap();
      if (result.data.isSuccess) {
        toast.success("Giả lập thanh toán thành công!");
        getOrderById(orderId);
        getPaymentStatus(orderId);
        localStorage.removeItem("pending_payment_order_id");
        navigate("/payment/success?orderCode=" + (currentOrder?.orderCode || queryOrderCode));
      } else {
        toast.error(result.data.message || "Giả lập thất bại");
      }
    } catch {
      toast.error("Lỗi khi giả lập thanh toán");
    } finally {
      setSimulating(false);
    }
  };

  if (searchingOrder || status === "loading" || (!paymentStatus && status === "idle")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 font-medium">Đang kiểm tra thông tin thanh toán...</p>
      </div>
    );
  }

  const isDev = import.meta.env.DEV || import.meta.env.VITE_ENV !== "production";
  const orderCancelled =
    currentOrder?.status === "Cancelled" || paymentStatus?.orderStatus === "Cancelled";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col items-center text-center">
        {/* Animated X-Mark Wrapper */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-red-500">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute inset-0 rounded-full bg-red-100/50"
          />
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="h-12 w-12 z-10"
            initial={{ strokeDasharray: 100, strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </motion.svg>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
        >
          Thanh toán bị hủy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-3 text-base text-gray-500 max-w-md"
        >
          {orderCancelled
            ? "Đơn hàng này đã được hủy hoàn toàn."
            : "Giao dịch thanh toán đã bị hủy bỏ hoặc không thể hoàn tất. Đơn hàng của bạn vẫn đang ở trạng thái Chờ thanh toán."}
        </motion.p>
      </div>

      {/* Transaction Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-100/30"
      >
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 text-gray-500 font-medium">
              <FileText className="h-4 w-4 text-gray-400" />
              Mã đơn hàng
            </span>
            <span className="font-bold text-gray-900 text-base">
              #{paymentStatus?.orderCode || currentOrder?.orderCode || queryOrderCode}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-3">
            <span className="text-gray-500 font-medium">Trạng thái đơn hàng</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                orderCancelled
                  ? "bg-red-50 text-red-700 ring-red-600/10"
                  : "bg-yellow-50 text-yellow-700 ring-yellow-600/10"
              }`}
            >
              {orderCancelled ? "Đã hủy đơn" : "Chờ thanh toán"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Dev Simulation Option */}
      {isDev && !orderCancelled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 rounded-xl border border-yellow-100 bg-yellow-50/50 p-4 text-sm text-yellow-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">Dev Mode:</span>
            <span>Bạn muốn giả lập thanh toán thành công cho đơn này?</span>
          </div>
          <button
            onClick={handleSimulatePaid}
            disabled={simulating}
            className="rounded-lg bg-yellow-600 px-3 py-1.5 font-bold text-white shadow-sm hover:bg-yellow-700 disabled:bg-gray-300 transition cursor-pointer flex items-center gap-1 shrink-0 ml-2"
          >
            {simulating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Xác nhận Đã trả
          </button>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 flex flex-col gap-4"
      >
        {/* Core Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!orderCancelled && (
            <button
              onClick={handleRetryPayment}
              disabled={retrying}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition disabled:bg-gray-300 cursor-pointer"
            >
              {retrying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              Thử thanh toán lại
            </button>
          )}

          <Link
            to={orderId ? `/profile/orders/${orderId}` : "/profile/orders"}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-base font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            Xem chi tiết đơn hàng
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Cancel Order completely option if the order is still pending */}
        {!orderCancelled && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/30 px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition disabled:opacity-50 cursor-pointer"
          >
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            Hủy đơn hàng hoàn toàn
          </button>
        )}

        {/* Back to Products */}
        <Link
          to="/products"
          className="flex items-center justify-center gap-2 rounded-xl border border-transparent px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition cursor-pointer"
        >
          <ShoppingBag className="h-4 w-4 text-gray-400" />
          Quay lại trang sản phẩm
        </Link>
      </motion.div>
    </div>
  );
}
