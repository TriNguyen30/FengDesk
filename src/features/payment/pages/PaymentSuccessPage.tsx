import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  ShoppingBag,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { usePayment } from "../hooks/usePayment";
import { useOrders } from "@/features/orders/hooks/useOrders";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const queryOrderCode = searchParams.get("orderCode");

  const { paymentStatus, status, getPaymentStatus, simulatePaid } = usePayment();
  const { currentOrder, getOrderById, getOrders } = useOrders();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [searchingOrder, setSearchingOrder] = useState(false);
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
      // Clean cached payment ID since it has succeeded
      localStorage.removeItem("pending_payment_order_id");
    }
  }, [orderId, getOrderById, getPaymentStatus]);

  // Developer simulation helper
  const handleSimulatePaid = async () => {
    if (!orderId) return;
    setSimulating(true);
    try {
      const result = await simulatePaid(orderId).unwrap();
      if (result.data.isSuccess) {
        toast.success("Giả lập thanh toán thành công!");
        // Reload order state
        getOrderById(orderId);
        getPaymentStatus(orderId);
      } else {
        toast.error(result.data.message || "Giả lập thất bại");
      }
    } catch {
      toast.error("Lỗi khi giả lập thanh toán");
    } finally {
      setSimulating(false);
    }
  };

  // Loading indicator while resolving orderId or fetching details
  if (searchingOrder || status === "loading" || (!paymentStatus && status === "idle")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 font-medium animate-pulse">
          Đang xác nhận kết quả giao dịch...
        </p>
      </div>
    );
  }

  // Format money helper
  const formatMoney = (val?: number) => {
    if (val == null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  // Check if development environment to display simulated payment option
  const isDev = import.meta.env.DEV || import.meta.env.VITE_ENV !== "production";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col items-center text-center">
        {/* Animated Checkmark Wrapper */}
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute inset-0 rounded-full bg-emerald-100/50"
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </motion.svg>
          {/* Confetti Micro-animations */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            className="absolute -top-1 -right-1 text-yellow-400"
          >
            <Sparkles className="h-5 w-5 fill-current" />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
        >
          Thanh toán thành công!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-3 text-base text-gray-500 max-w-md"
        >
          Giao dịch của bạn đã được xử lý hoàn tất. Cảm ơn bạn đã tin tưởng mua sắm tại FengShui
          Garden.
        </motion.p>
      </div>

      {/* Payment Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-100/30"
      >
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Chi tiết giao dịch</h2>
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

          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 text-gray-500 font-medium">
              <DollarSign className="h-4 w-4 text-gray-400" />
              Số tiền đã thanh toán
            </span>
            <span className="font-extrabold text-primary text-lg">
              {formatMoney(paymentStatus?.amount || currentOrder?.totalAmount)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 text-gray-500 font-medium">
              <Calendar className="h-4 w-4 text-gray-400" />
              Thời gian giao dịch
            </span>
            <span className="text-gray-800 font-medium">
              {paymentStatus?.paidAt
                ? new Date(paymentStatus.paidAt).toLocaleString("vi-VN")
                : new Date().toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-3">
            <span className="text-gray-500 font-medium">Trạng thái thanh toán</span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
              {paymentStatus?.paymentStatus === "Paid" ? "Đã thanh toán" : "Thành công"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Developer simulation banner for status syncing */}
      {isDev && paymentStatus?.paymentStatus !== "Paid" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 rounded-xl border border-yellow-100 bg-yellow-50/50 p-4 text-sm text-yellow-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">Dev Mode:</span>
            <span>Nếu trạng thái chưa cập nhật thành "Paid", bạn có thể kích hoạt giả lập.</span>
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

      {/* Navigation Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link
          to={orderId ? `/profile/orders/${orderId}` : "/profile/orders"}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition cursor-pointer"
        >
          Xem chi tiết đơn hàng
          <ChevronRight className="h-5 w-5" />
        </Link>
        <Link
          to="/products"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-base font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
        >
          <ShoppingBag className="h-5 w-5 text-gray-500" />
          Tiếp tục mua sắm
        </Link>
      </motion.div>
    </div>
  );
}
