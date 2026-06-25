import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, MapPin, Package, RotateCcw, X, CheckSquare, ClipboardList, CreditCard, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useOrderDetail, useCancelOrder } from "../hooks/useOrders";
import { formatOrderDate, formatVnd, getOrderStatusMeta } from "../utils/orderUtils";
import { paymentApi } from "@/features/payment";
import { returnApi } from "@/features/return/api/return.api";
import type { ReturnType, ReturnReason, CreateReturnRequest, CreateReturnItemRequest } from "@/features/return/types/return.d.ts";
import type { OrderLineItem } from "@/features/orders/types/orders";

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

const DELIVERY_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  Pending: { label: "Đang chờ", color: "text-amber-600" },
  Confirmed: { label: "Đã xác nhận", color: "text-indigo-600" },
  Preparing: { label: "Đang chuẩn bị", color: "text-blue-600" },
  Shipped: { label: "Đang giao hàng", color: "text-blue-600" },
  Delivered: { label: "Đã giao hàng", color: "text-emerald-600" },
  Cancelled: { label: "Đã hủy", color: "text-red-500" },
  Returned: { label: "Đã trả hàng", color: "text-red-500" },
};

// State for selected items per order line item
interface SelectedItem {
  orderItemId: string;
  quantity: number;
  maxQuantity: number;
}

interface ReturnModalState {
  open: boolean;
  deliveryId: string | null;
  /** Items belonging to this delivery */
  items: OrderLineItem[];
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, detailStatus } = useOrderDetail(id);
  const cancelOrderMutation = useCancelOrder();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);

  // Return modal state
  const [returnModal, setReturnModal] = useState<ReturnModalState>({ open: false, deliveryId: null, items: [] });
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

  // Toggle all items selection
  const handleToggleAll = () => {
    if (Object.keys(selectedItems).length === returnModal.items.length) {
      setSelectedItems({});
    } else {
      const all: Record<string, SelectedItem> = {};
      returnModal.items.forEach((item) => {
        all[item.id] = { orderItemId: item.id, quantity: item.quantity, maxQuantity: item.quantity };
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
      return { ...prev, [item.id]: { orderItemId: item.id, quantity: item.quantity, maxQuantity: item.quantity } };
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
        <Link to="/profile/orders" className="mt-4 text-sm font-medium text-primary hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const order = currentOrder;
  const statusMeta = getOrderStatusMeta(order.status, order.paymentMethod);
  const canCancel = !["Cancelled", "Completed", "Expired"].includes(order.status);
  const deliveries: any[] = (order as any).deliveries ?? [];

  // Check if any delivery is Delivered → show return section
  const hasDeliveredDelivery = deliveries.some((d) => d.status === "Delivered");

  // Items belonging to a given deliveryId (matched via item.deliveryId)
  const getDeliveryItems = (deliveryId: string): OrderLineItem[] =>
    (order.items ?? []).filter((item) => item.deliveryId === deliveryId);

  const allSelected = returnModal.items.length > 0 && Object.keys(selectedItems).length === returnModal.items.length;
  const someSelected = Object.keys(selectedItems).length > 0 && !allSelected;

  const getSteps = () => {
    if (order.status === "Cancelled") {
      return [
        { label: "Đơn hàng đã đặt", date: order.createdAt, completed: true, icon: <ClipboardList className="h-5 w-5" /> },
        { label: "Đã hủy", date: order.statusLogs?.find(l => l.toStatus === "Cancelled")?.changedAt, completed: true, isError: true, icon: <X className="h-5 w-5" /> }
      ];
    }
    
    if (order.status === "Expired") {
      return [
        { label: "Đơn hàng đã đặt", date: order.createdAt, completed: true, icon: <ClipboardList className="h-5 w-5" /> },
        { label: "Đã hết hạn", date: order.statusLogs?.find(l => l.toStatus === "Expired")?.changedAt, completed: true, isError: true, icon: <X className="h-5 w-5" /> }
      ];
    }

    const steps = [
      { id: "Pending", label: "Đơn hàng đã đặt", icon: <ClipboardList className="h-5 w-5" /> },
    ];

    if (order.paymentMethod === "PayOS") {
      steps.push({ id: "Paid", label: "Đã thanh toán", icon: <CreditCard className="h-5 w-5" /> });
    }

    steps.push({ id: "Processing", label: "Đang xử lý", icon: <Package className="h-5 w-5" /> });
    steps.push({ id: "Completed", label: "Đã hoàn thành", icon: <CheckCircle className="h-5 w-5" /> });

    let currentIdx = steps.findIndex(s => s.id === order.status);
    if (order.status === "Completed") currentIdx = steps.length - 1;

    return steps.map((s, idx) => {
      let date = null;
      if (s.id === "Pending") date = order.createdAt;
      else {
        const log = order.statusLogs?.find(l => l.toStatus === s.id);
        if (log) date = log.changedAt;
      }
      
      const isCompleted = currentIdx >= idx || order.status === "Completed";
      
      return {
        ...s,
        date,
        completed: isCompleted,
        isError: false,
      };
    });
  };

  const steps = getSteps();

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

      {/* Stepper */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm overflow-x-auto">
        <div className="relative flex justify-between min-w-[500px]">
          {/* Progress Line Background */}
          <div className="absolute top-5 left-8 right-8 h-1 bg-gray-100 rounded"></div>
          
          {/* Progress Line Active */}
          <div 
             className="absolute top-5 left-8 h-1 bg-primary rounded transition-all duration-500"
             style={{ width: `calc(${(Math.max(0, steps.filter(s => s.completed).length - 1) / Math.max(1, steps.length - 1)) * 100}% - 4rem)` }}
          ></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-3 w-1/4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white shadow-sm ${step.isError ? 'bg-red-500 text-white' : step.completed ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step.icon}
              </div>
              <div className="text-center">
                <p className={`text-sm font-bold ${step.isError ? 'text-red-600' : step.completed ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                {step.date && <p className="text-xs text-gray-500 mt-1">{formatOrderDate(step.date)}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Products */}
          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Sản phẩm</h2>
            <ul className="divide-y divide-gray-100">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-100">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
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

          {/* Deliveries */}
          {deliveries.length > 0 && (
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              {/* Header row: title + return button (if any delivery is Delivered) */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Đơn giao hàng</h2>
                {hasDeliveredDelivery && (
                  <button
                    onClick={() => setDeliveryPickerOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Yêu cầu trả hàng
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {deliveries.map((delivery) => {
                  const statusInfo = DELIVERY_STATUS_LABEL[delivery.status] ?? { label: delivery.status, color: "text-gray-600" };
                  const isDelivered = delivery.status === "Delivered";
                  // returnRequest is embedded in delivery by backend (nullable)
                  const returnRequest: { id: string; status: string } | null = delivery.returnRequest ?? null;
                  const hasPendingReturn = returnRequest && returnRequest.status === "Requested";
                  return (
                    <div
                      key={delivery.id}
                      className={`rounded-lg border p-4 flex items-center justify-between gap-3 ${
                        isDelivered ? "border-emerald-100 bg-emerald-50/30" : "border-gray-100 bg-gray-50/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        {delivery.storeName && (
                          <p className="text-sm font-semibold text-gray-800">{delivery.storeName}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Trạng thái:{" "}
                          <span className={`font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </p>
                        {delivery.orderCode && (
                          <p className="text-xs text-gray-400 font-mono">#{delivery.orderCode}</p>
                        )}
                        {/* Show pending return badge */}
                        {hasPendingReturn && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                            Đang chờ xử lý trả hàng
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Per-delivery return button if multiple delivered deliveries */}
                        {isDelivered && !hasPendingReturn && deliveries.filter((d) => d.status === "Delivered").length > 1 && (
                          <button
                            onClick={() => {
                              const items = getDeliveryItems(delivery.id);
                              openReturnModal(delivery.id, items);
                            }}
                            className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Trả
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Shipping Address */}
          {(order as any).shippingAddress && (
            <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
                <MapPin className="h-5 w-5 text-primary" />
                Địa chỉ giao hàng
              </h2>
              <p className="font-medium text-gray-900">
                {(order as any).shippingAddress?.recipientName} ·{" "}
                {(order as any).shippingAddress?.recipientPhone}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {(order as any).shippingAddress?.streetAddress}
              </p>
              {(order as any).shippingAddress?.wardName && (
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
            <p className="mt-3 text-xs text-gray-500">Phương thức: {order.paymentMethod}</p>
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

      {/* Cancel Order Modal */}
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

      {/* ── Delivery Picker Modal ── */}
      {deliveryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-orange-50/60">
              <h3 className="text-base font-bold text-gray-900">Chọn đơn giao hàng</h3>
              <button
                onClick={() => setDeliveryPickerOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* List — chỉ deliveries có status Delivered */}
            <div className="px-4 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {deliveries
                .filter((d) => d.status === "Delivered")
                .map((delivery) => (
                  <button
                    key={delivery.id}
                    type="button"
                    onClick={() => {
                      setDeliveryPickerOpen(false);
                      const items = getDeliveryItems(delivery.id);
                      openReturnModal(delivery.id, items);
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

            {/* Footer */}
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

      {/* ── Return Request Modal ──────────────────────────────────── */}
      {returnModal.open && returnModal.deliveryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
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

            {/* Body */}
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
                          className={`flex items-center gap-3 p-3 transition-colors ${isChecked ? "bg-orange-50/50" : "bg-white hover:bg-gray-50/50"
                            }`}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(item)}
                            className="h-4 w-4 rounded accent-orange-500 cursor-pointer shrink-0"
                          />
                          {/* Product icon */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                            {(item as any).variantName && (
                              <p className="text-xs text-gray-400">{(item as any).variantName}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">{formatVnd(item.unitPrice)}</p>
                          </div>
                          {/* Quantity selector */}
                          {isChecked ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChange(item.id, Math.max(1, (selectedItems[item.id]?.quantity ?? 1) - 1))
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
                                    Math.min(item.quantity, (selectedItems[item.id]?.quantity ?? 1) + 1)
                                  )
                                }
                                className="h-6 w-6 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-bold cursor-pointer"
                              >
                                +
                              </button>
                              <span className="text-xs text-gray-400 ml-0.5">/ {item.quantity}</span>
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

              {/* Return Type */}
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
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer ${returnType === opt.value
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
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Reason Detail */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mô tả thêm</label>
                <textarea
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề của bạn..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200 transition-all resize-none"
                />
              </div>

              {/* Bank Info (only for Refund) */}
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

            {/* Footer */}
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