import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  MapPin,
  Package,
  RotateCcw,
  X,
  CheckSquare,
  ClipboardList,
  CreditCard,
  CheckCircle,
  Truck,
  Store,
  MessageCircle,
  ShoppingCart,
  FileText,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useOrderDetail, useCancelOrder } from "../hooks/useOrders";
import { formatOrderDate, formatVnd, getOrderStatusMeta } from "../utils/orderUtils";
import { paymentApi } from "@/features/payment";
import { returnApi } from "@/features/return/api/return.api";
import type {
  ReturnType,
  ReturnReason,
  CreateReturnRequest,
  CreateReturnItemRequest,
} from "@/features/return/types/return.d.ts";
import type { OrderLineItem } from "@/features/orders/types/orders";
import { useAddressDetail } from "@/features/users/hooks/useAddress";

const RETURN_TYPE_OPTIONS: { value: ReturnType; label: string }[] = [
  { value: "Refund", label: "Hoàn tiền" },
  { value: "Exchange", label: "Đổi hàng" },
];

const REASON_OPTIONS: { value: ReturnReason; label: string }[] = [
  { value: "Defective", label: "Sản phẩm bị lỗi" },
  { value: "WrongItem", label: "Sai sản phẩm" },
  { value: "NotAsDescribed", label: "Không đúng mô tả" },
  { value: "DamagedInTransit", label: "Hư hỏng trong vận chuyển" },
  { value: "ChangedMind", label: "Đổi ý" },
  { value: "Other", label: "Lý do khác" },
];

const DELIVERY_STATUS_LABEL: Record<string, { label: string; pillClass: string }> = {
  Pending: { label: "Đang chờ", pillClass: "bg-amber-50 text-amber-700 border border-amber-200" },
  Confirmed: {
    label: "Đã xác nhận",
    pillClass: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  },
  Preparing: {
    label: "Đang chuẩn bị",
    pillClass: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  Shipped: {
    label: "Đang giao hàng",
    pillClass: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  Delivered: {
    label: "Đã giao hàng",
    pillClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  Cancelled: { label: "Đã hủy", pillClass: "bg-red-50 text-red-600 border border-red-200" },
  Returned: { label: "Đã trả hàng", pillClass: "bg-red-50 text-red-600 border border-red-200" },
};

interface SelectedItem {
  orderItemId: string;
  quantity: number;
  maxQuantity: number;
}

interface ReturnModalState {
  open: boolean;
  deliveryId: string | null;
  items: OrderLineItem[];
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, detailStatus } = useOrderDetail(id);
  const { address: shippingAddress } = useAddressDetail(currentOrder?.shippingAddressId);
  const cancelOrderMutation = useCancelOrder();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [returnModal, setReturnModal] = useState<ReturnModalState>({
    open: false,
    deliveryId: null,
    items: [],
  });
  const [returnType, setReturnType] = useState<ReturnType>("Refund");
  const [returnReason, setReturnReason] = useState<ReturnReason>("Defective");
  const [reasonDetail, setReasonDetail] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [deliveryPickerOpen, setDeliveryPickerOpen] = useState(false);

  const openReturnModal = (deliveryId: string, items: OrderLineItem[]) => {
    setReturnType("Refund");
    setReturnReason("Defective");
    setReasonDetail("");
    setBankAccountName("");
    setBankAccountNumber("");
    setBankName("");
    setSelectedItems({});
    setReturnModal({ open: true, deliveryId, items });
  };

  const closeReturnModal = () => setReturnModal({ open: false, deliveryId: null, items: [] });

  const handleToggleAll = () => {
    if (Object.keys(selectedItems).length === returnModal.items.length) {
      setSelectedItems({});
    } else {
      const all: Record<string, SelectedItem> = {};
      returnModal.items.forEach((item) => {
        all[item.id] = {
          orderItemId: item.id,
          quantity: item.quantity,
          maxQuantity: item.quantity,
        };
      });
      setSelectedItems(all);
    }
  };

  const handleToggleItem = (item: OrderLineItem) => {
    setSelectedItems((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: { orderItemId: item.id, quantity: item.quantity, maxQuantity: item.quantity },
      };
    });
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems((prev) => {
      if (!prev[itemId]) return prev;
      return { ...prev, [itemId]: { ...prev[itemId], quantity } };
    });
  };

  const handleSubmitReturn = async () => {
    if (!returnModal.deliveryId) return;
    const checkedItems = Object.values(selectedItems);
    if (checkedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để trả.");
      return;
    }
    setSubmittingReturn(true);
    try {
      const items: CreateReturnItemRequest[] = checkedItems.map((si) => ({
        orderItemId: si.orderItemId,
        quantity: si.quantity,
      }));
      const payload: CreateReturnRequest = {
        deliveryId: returnModal.deliveryId,
        type: returnType,
        reason: returnReason,
        reasonDetail: reasonDetail || null,
        items,
        ...(returnType === "Refund" && {
          bankAccountName: bankAccountName || null,
          bankAccountNumber: bankAccountNumber || null,
          bankName: bankName || null,
        }),
      };
      const res = await returnApi.createReturn(payload);
      if (res.data.isSuccess) {
        toast.success("Gửi yêu cầu trả hàng thành công!");
        closeReturnModal();
      } else {
        toast.error(res.data.message || "Không thể gửi yêu cầu trả hàng");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu");
    } finally {
      setSubmittingReturn(false);
    }
  };

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
  const deliveries: any[] = (order as any).deliveries ?? [];
  const returnableDeliveries = deliveries.filter((d) => {
    if (d.status !== "Delivered") return false;
    const rr = d.returnRequest;
    return !rr || ["Rejected", "Cancelled"].includes(rr.status);
  });
  const hasReturnableDelivery = returnableDeliveries.length > 0;

  const getDeliveryItems = (deliveryId: string): OrderLineItem[] =>
    (order.items ?? []).filter((item) => item.deliveryId === deliveryId);

  const allSelected =
    returnModal.items.length > 0 && Object.keys(selectedItems).length === returnModal.items.length;

  const getSteps = () => {
    if (order.status === "Cancelled") {
      return [
        {
          label: "Đơn đã đặt",
          date: order.createdAt,
          completed: true,
          isError: false,
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          label: "Đã hủy",
          date: order.statusLogs?.find((l: any) => l.toStatus === "Cancelled")?.changedAt,
          completed: true,
          isError: true,
          icon: <X className="h-4 w-4" />,
        },
      ];
    }
    if (order.status === "Expired") {
      return [
        {
          label: "Đơn đã đặt",
          date: order.createdAt,
          completed: true,
          isError: false,
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          label: "Đã hết hạn",
          date: order.statusLogs?.find((l: any) => l.toStatus === "Expired")?.changedAt,
          completed: true,
          isError: true,
          icon: <X className="h-4 w-4" />,
        },
      ];
    }

    const steps: { id: string; label: string; icon: React.ReactNode }[] = [
      { id: "Pending", label: "Đơn đã đặt", icon: <ClipboardList className="h-4 w-4" /> },
    ];
    if (order.paymentMethod === "PayOS") {
      steps.push({ id: "Paid", label: "Đã thanh toán", icon: <CreditCard className="h-4 w-4" /> });
    }
    steps.push({ id: "Processing", label: "Đang xử lý", icon: <Package className="h-4 w-4" /> });
    steps.push({ id: "Completed", label: "Hoàn thành", icon: <CheckCircle className="h-4 w-4" /> });

    let currentIdx = steps.findIndex((s) => s.id === order.status);
    if (order.status === "Completed") currentIdx = steps.length - 1;

    return steps.map((s, idx) => {
      let date = null;
      if (s.id === "Pending") date = order.createdAt;
      else {
        const log = order.statusLogs?.find((l: any) => l.toStatus === s.id);
        if (log) date = log.changedAt;
      }
      return {
        ...s,
        date,
        completed: currentIdx >= idx || order.status === "Completed",
        isError: false,
      };
    });
  };

  const steps = getSteps();

  // Determine active step index (first incomplete, or last if all done)
  const activeIdx = steps.findIndex((s, i) => s.completed && !steps[i + 1]?.completed);

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => navigate("/profile/orders")}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại đơn hàng
      </button>

      <div className="flex flex-col gap-3">
        {/* ── Status banner + Stepper ── */}
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div
            className={`flex items-center justify-between px-5 py-4 border-b-2 ${
              order.status === "Cancelled" || order.status === "Expired"
                ? "bg-red-50 border-red-400"
                : order.status === "Completed"
                  ? "bg-emerald-50 border-emerald-500"
                  : "bg-violet-50 border-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              {order.status === "Cancelled" || order.status === "Expired" ? (
                <X className="h-6 w-6 text-red-500 shrink-0" />
              ) : order.status === "Completed" ? (
                <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
              ) : (
                <Truck className="h-6 w-6 text-primary shrink-0" />
              )}
              <div>
                <p
                  className={`font-semibold text-base leading-tight ${
                    order.status === "Cancelled" || order.status === "Expired"
                      ? "text-red-700"
                      : order.status === "Completed"
                        ? "text-emerald-700"
                        : "text-violet-800"
                  }`}
                >
                  {statusMeta.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Đặt lúc {formatOrderDate(order.createdAt)}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-gray-400">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Stepper */}
          <div className="px-5 pt-5 pb-4 overflow-x-auto">
            <div className="flex items-start min-w-[400px]">
              {steps.map((step, idx) => {
                const isLast = idx === steps.length - 1;
                const isActive = idx === activeIdx;
                const lineRight = !isLast && steps[idx + 1]?.completed;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-center">
                      {/* left line */}
                      <div
                        className={`flex-1 h-0.5 ${idx === 0 ? "invisible" : step.isError ? "bg-red-400" : step.completed ? "bg-primary" : "bg-gray-100"}`}
                      />
                      {/* dot */}
                      <div
                        className={[
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all",
                          step.isError
                            ? "bg-red-500 text-white"
                            : isActive
                              ? "bg-white border-2 border-primary text-primary shadow-[0_0_0_4px_#ede9fe]"
                              : step.completed
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-400 border border-gray-200",
                        ].join(" ")}
                      >
                        {step.icon}
                      </div>
                      {/* right line */}
                      <div
                        className={`flex-1 h-0.5 ${isLast ? "invisible" : step.isError ? "bg-red-400" : lineRight ? "bg-primary" : "bg-gray-100"}`}
                      />
                    </div>
                    <div className="text-center px-1">
                      <p
                        className={`text-xs font-semibold leading-tight ${
                          step.isError
                            ? "text-red-600"
                            : step.completed || isActive
                              ? "text-gray-900"
                              : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatOrderDate(step.date)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Products ── */}
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
          {/* Store header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Store className="h-4 w-4 text-primary" />
              Sản phẩm
            </div>
          </div>

          {/* Product rows */}
          <ul className="divide-y divide-gray-100">
            {(order.items ?? []).map((item) => (
              <li key={item.id} className="flex gap-3 px-4 py-3.5 items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                  <Package className="h-5 w-5 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">
                    {item.productName}
                  </p>
                  {(item as any).variantName && (
                    <span className="mt-1 inline-block text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      {(item as any).variantName}
                    </span>
                  )}
                  <p className="mt-1 text-xs text-gray-400">x{item.quantity}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{formatVnd(item.lineTotal)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatVnd(item.unitPrice)} / cái</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Price breakdown */}
          <div className="border-t border-dashed border-gray-200 mt-1 mx-4" />
          <div className="px-4 py-1.5 space-y-1 mt-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tạm tính</span>
              <span>{formatVnd(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Phí vận chuyển</span>
              <span>
                {order.totalShippingFee != null ? formatVnd(order.totalShippingFee) : "Chưa tính"}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center px-4 py-3 border-t border-dashed border-gray-200 mt-1">
            <span className="text-sm font-semibold text-gray-800">Thành tiền</span>
            <span className="text-lg font-bold text-primary">{formatVnd(order.totalAmount)}</span>
          </div>

          {/* Payment method row */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <CreditCard className="h-4 w-4 text-primary shrink-0" />
            <span>Thanh toán qua</span>
            <span className="font-semibold text-gray-800">{order.paymentMethod}</span>
            {order.status !== "Pending" && order.paymentMethod === "PayOS" && (
              <span className="ml-auto text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-0.5 rounded-full">
                Đã thanh toán
              </span>
            )}
          </div>
        </div>

        {/* ── Deliveries ── */}
        {deliveries.length > 0 && (
          <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Truck className="h-4 w-4 text-primary" />
                Đơn giao hàng
              </div>
              {hasReturnableDelivery && (
                <button
                  onClick={() => setDeliveryPickerOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Yêu cầu trả hàng
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {deliveries.map((delivery) => {
                const statusInfo = DELIVERY_STATUS_LABEL[delivery.status] ?? {
                  label: delivery.status,
                  pillClass: "bg-gray-100 text-gray-600",
                };
                const isDelivered = delivery.status === "Delivered";
                const returnRequest: { id: string; status: string } | null =
                  delivery.returnRequest ?? null;
                const hasActiveReturn =
                  returnRequest && !["Rejected", "Cancelled"].includes(returnRequest.status);
                const multiDelivered =
                  deliveries.filter((d) => d.status === "Delivered").length > 1;

                return (
                  <div key={delivery.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {delivery.storeName && (
                        <p className="text-sm font-semibold text-gray-800">{delivery.storeName}</p>
                      )}
                      {delivery.orderCode && (
                        <p className="text-xs font-mono text-gray-400 mt-0.5">
                          #{delivery.orderCode}
                        </p>
                      )}
                      {hasActiveReturn && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                          {returnRequest.status === "Requested"
                            ? "Đang chờ xử lý trả hàng"
                            : "Đang xử lý trả hàng"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isDelivered && !hasActiveReturn && multiDelivered && (
                        <button
                          onClick={() =>
                            openReturnModal(delivery.id, getDeliveryItems(delivery.id))
                          }
                          className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Trả
                        </button>
                      )}
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.pillClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Shipping address ── */}
        {shippingAddress && (
          <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-800">
              <MapPin className="h-4 w-4 text-primary" />
              Địa chỉ nhận hàng
            </div>
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-sm font-semibold text-gray-900">
                  {shippingAddress.recipientName}
                </p>
                <span className="text-gray-300">|</span>
                <p className="text-sm text-gray-500">{shippingAddress.recipientPhone}</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {shippingAddress.label && (
                  <span className="inline-block text-xs text-primary border border-primary px-1.5 py-0.5 rounded mr-1.5 align-middle">
                    {shippingAddress.label}
                  </span>
                )}
                {shippingAddress.streetAddress}
              </p>
            </div>
          </div>
        )}

        {/* ── Note ── */}
        {order.note && (
          <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
            <div className="flex gap-3 px-4 py-3.5 items-start">
              <StickyNote className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1">Ghi chú</p>
                <p className="text-sm text-gray-600">{order.note}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Action bar ── */}
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
          <div className="flex gap-2 px-4 py-3">
            {/* Pay now — only for unpaid PayOS */}
            {order.paymentMethod === "PayOS" && order.status === "Pending" && (
              <button
                onClick={handlePayNow}
                disabled={paying}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold py-2.5 hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition-colors"
              >
                {paying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {paying ? "Đang xử lý..." : "Thanh toán ngay"}
              </button>
            )}

            {/* Return — shown when there's a delivered delivery and payment is done */}
            {hasReturnableDelivery && order.status !== "Pending" && (
              <button
                onClick={() => setDeliveryPickerOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-orange-300 text-orange-600 bg-orange-50 text-sm font-semibold py-2.5 hover:bg-orange-100 cursor-pointer transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Trả hàng
              </button>
            )}

            {/* Buy again */}
            <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold py-2.5 hover:bg-primary/90 cursor-pointer transition-colors">
              <ShoppingCart className="h-4 w-4" />
              Mua lại
            </button>

            {/* Cancel */}
            {canCancel && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm font-medium px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
                Hủy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Cancel Modal ── */}
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

      {/* ── Delivery Picker Modal ── */}
      {deliveryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-orange-50/60">
              <h3 className="text-base font-bold text-gray-900">Chọn đơn giao hàng</h3>
              <button
                onClick={() => setDeliveryPickerOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {returnableDeliveries.map((delivery) => (
                <button
                  key={delivery.id}
                  type="button"
                  onClick={() => {
                    setDeliveryPickerOpen(false);
                    openReturnModal(delivery.id, getDeliveryItems(delivery.id));
                  }}
                  className="w-full text-left rounded-xl border border-gray-100 bg-gray-50 hover:border-orange-200 hover:bg-orange-50/50 px-4 py-3 transition-colors cursor-pointer"
                >
                  {delivery.storeName && (
                    <p className="text-sm font-semibold text-gray-800">{delivery.storeName}</p>
                  )}
                  {delivery.orderCode && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">#{delivery.orderCode}</p>
                  )}
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                    Đã giao hàng
                  </span>
                </button>
              ))}
            </div>
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50/50">
              <button
                onClick={() => setDeliveryPickerOpen(false)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Return Request Modal ── */}
      {returnModal.open && returnModal.deliveryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-orange-50/60">
              <div>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">
                  Trả hàng / Hoàn tiền
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">Yêu cầu trả hàng</h3>
              </div>
              <button
                onClick={closeReturnModal}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Item selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-600">
                    Chọn sản phẩm muốn trả <span className="text-red-500">*</span>
                  </label>
                  {returnModal.items.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleAll}
                      className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 cursor-pointer"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </button>
                  )}
                </div>

                {returnModal.items.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-3 text-center">
                    Không tìm thấy sản phẩm nào trong đơn giao này.
                  </p>
                ) : (
                  <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    {returnModal.items.map((item) => {
                      const isChecked = !!selectedItems[item.id];
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 transition-colors ${isChecked ? "bg-orange-50/50" : "bg-white hover:bg-gray-50/50"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(item)}
                            className="h-4 w-4 rounded accent-orange-500 cursor-pointer shrink-0"
                          />
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.productName}
                            </p>
                            {(item as any).variantName && (
                              <p className="text-xs text-gray-400">{(item as any).variantName}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatVnd(item.unitPrice)}
                            </p>
                          </div>
                          {isChecked ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    Math.max(1, (selectedItems[item.id]?.quantity ?? 1) - 1),
                                  )
                                }
                                className="h-6 w-6 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-bold cursor-pointer"
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-sm font-semibold text-gray-800">
                                {selectedItems[item.id]?.quantity ?? 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    Math.min(
                                      item.quantity,
                                      (selectedItems[item.id]?.quantity ?? 1) + 1,
                                    ),
                                  )
                                }
                                className="h-6 w-6 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-bold cursor-pointer"
                              >
                                +
                              </button>
                              <span className="text-xs text-gray-400 ml-0.5">
                                / {item.quantity}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 shrink-0">x{item.quantity}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Return type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Hình thức <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RETURN_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReturnType(opt.value)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                        returnType === opt.value
                          ? "border-orange-400 bg-orange-50 text-orange-600"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Lý do <span className="text-red-500">*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200 transition-all"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason detail */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Mô tả thêm
                </label>
                <textarea
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề của bạn..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200 transition-all resize-none"
                />
              </div>

              {/* Bank info */}
              {returnType === "Refund" && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                    Thông tin tài khoản ngân hàng (tuỳ chọn)
                  </p>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tên chủ tài khoản</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="NGUYEN VAN A"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Số tài khoản</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="0123456789"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tên ngân hàng</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Vietcombank"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
              <button
                type="button"
                onClick={closeReturnModal}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitReturn}
                disabled={submittingReturn}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submittingReturn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi yêu cầu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
