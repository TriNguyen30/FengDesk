import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  PackageX,
  Check,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  Package,
  Clock,
  PackageCheck,
  Banknote,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { returnApi } from "@/features/return/api/return.api";
import type { ReturnItem, ReturnDetail } from "@/features/return/types/return.d.ts";
import { formatVnd, formatOrderDate } from "@/features/orders/utils/orderUtils";
import { useQueryClient } from "@tanstack/react-query";

const PENDING_STATUS = "Requested";

const RETURN_TYPE_LABEL: Record<string, string> = {
  Refund: "Hoàn tiền",
  Exchange: "Đổi hàng",
};

const REASON_LABEL: Record<string, string> = {
  Defective: "Sản phẩm bị lỗi",
  WrongItem: "Sai sản phẩm",
  NotAsDescribed: "Không đúng mô tả",
  DamagedInTransit: "Hư hỏng trong vận chuyển",
  ChangedMind: "Đổi ý",
  Other: "Lý do khác",
};

const RETURN_STATUS_META: Record<string, { label: string; className: string }> = {
  Requested: { label: "Yêu cầu mới", className: "bg-amber-50 text-amber-600 border border-amber-200" },
  Approved: { label: "Đã duyệt", className: "bg-indigo-50 text-indigo-600 border border-indigo-200" },
  Rejected: { label: "Đã từ chối", className: "bg-red-50 text-red-500 border border-red-200" },
  Processing: { label: "Đang xử lý", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  Completed: { label: "Hoàn tất", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  Cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-500 border border-gray-200" },
  ReturnInTransit: { label: "Đang chuyển về", className: "bg-sky-50 text-sky-600 border border-sky-200" },
  ItemReceived: { label: "Đã nhận hàng", className: "bg-teal-50 text-teal-600 border border-teal-200" },
  Refunding: { label: "Đang hoàn tiền", className: "bg-violet-50 text-violet-600 border border-violet-200" },
  Exchanging: { label: "Đang đổi hàng", className: "bg-purple-50 text-purple-600 border border-purple-200" },
};

// ── Approve confirm modal state ──────────────────────────────────────────────
interface ApproveModalState {
  open: boolean;
  returnId: string | null;
}

// ── Reject confirm modal state ───────────────────────────────────────────────
interface RejectModalState {
  open: boolean;
  returnId: string | null;
}

// ── Receive confirm modal state ──────────────────────────────────────────────
interface ReceiveModalState {
  open: boolean;
  returnId: string | null;
}

// ── Resolve confirm modal state ──────────────────────────────────────────────
interface ResolveModalState {
  open: boolean;
  returnId: string | null;
}

// ── Complete Refund confirm modal state ──────────────────────────────────────
interface CompleteRefundModalState {
  open: boolean;
  returnId: string | null;
}

// ── Detail modal state ───────────────────────────────────────────────────────
interface DetailModalState {
  open: boolean;
  returnId: string | null;
}

export default function ManageOrderReturnPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Approve modal
  const [approveModal, setApproveModal] = useState<ApproveModalState>({
    open: false,
    returnId: null,
  });
  const [approveNote, setApproveNote] = useState("");
  const [approving, setApproving] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<RejectModalState>({ open: false, returnId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Receive modal
  const [receiveModal, setReceiveModal] = useState<ReceiveModalState>({ open: false, returnId: null });
  const [receiving, setReceiving] = useState(false);

  // Resolve modal
  const [resolveModal, setResolveModal] = useState<ResolveModalState>({ open: false, returnId: null });
  const [resolveRestock, setResolveRestock] = useState(true);
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);

  // Complete Refund modal
  const [completeRefundModal, setCompleteRefundModal] = useState<CompleteRefundModalState>({ open: false, returnId: null });
  const [completingRefund, setCompletingRefund] = useState(false);

  // Detail modal
  const [detailModal, setDetailModal] = useState<DetailModalState>({ open: false, returnId: null });
  const [returnDetail, setReturnDetail] = useState<ReturnDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchReturns = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await returnApi.getAllReturns({ Page: 1, PageSize: 50 });
      await queryClient.invalidateQueries({ queryKey: ["returns"] });
      if (response.data?.isSuccess) {
        setReturns(response.data.data.items);
      } else {
        toast.error(response.data?.message || "Lỗi khi tải danh sách trả hàng");
      }
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi tải danh sách trả hàng");
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  // ── Detail handlers ───────────────────────────────────────────────────────
  const openDetailModal = async (returnId: string) => {
    setDetailModal({ open: true, returnId });
    setReturnDetail(null);
    setLoadingDetail(true);
    try {
      const res = await returnApi.getReturnById(returnId);
      if (res.data.isSuccess) {
        setReturnDetail(res.data.data);
      } else {
        toast.error(res.data.message || "Không thể tải chi tiết yêu cầu trả hàng");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi tải chi tiết yêu cầu");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModal({ open: false, returnId: null });
    setReturnDetail(null);
  };

  // ── Approve handlers ───────────────────────────────────────────────────────
  const openApproveModal = (returnId: string) => {
    setApproveNote("");
    setApproveModal({ open: true, returnId });
  };

  const closeApproveModal = () => setApproveModal({ open: false, returnId: null });

  const handleApprove = async () => {
    if (!approveModal.returnId) return;
    setApproving(true);
    try {
      const res = await returnApi.approveReturn(approveModal.returnId, {
        note: approveNote || null,
      });
      if (res.data.isSuccess) {
        toast.success("Đã duyệt yêu cầu trả hàng");
        closeApproveModal();
        fetchReturns();
      } else {
        toast.error(res.data.message || "Không thể duyệt yêu cầu trả hàng");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi duyệt yêu cầu");
    } finally {
      setApproving(false);
    }
  };

  // ── Reject handlers ────────────────────────────────────────────────────────
  const openRejectModal = (returnId: string) => {
    setRejectReason("");
    setRejectModal({ open: true, returnId });
  };

  const closeRejectModal = () => setRejectModal({ open: false, returnId: null });

  const handleReject = async () => {
    if (!rejectModal.returnId) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    setRejecting(true);
    try {
      const res = await returnApi.rejectReturn(rejectModal.returnId, { reason: rejectReason });
      if (res.data.isSuccess) {
        toast.success("Đã từ chối yêu cầu trả hàng");
        closeRejectModal();
        fetchReturns();
      } else {
        toast.error(res.data.message || "Không thể từ chối yêu cầu trả hàng");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi từ chối yêu cầu");
    } finally {
      setRejecting(false);
    }
  };

  // ── Receive handlers ───────────────────────────────────────────────────────
  const openReceiveModal = (returnId: string) => {
    setReceiveModal({ open: true, returnId });
  };

  const closeReceiveModal = () => setReceiveModal({ open: false, returnId: null });

  const handleReceive = async () => {
    if (!receiveModal.returnId) return;
    setReceiving(true);
    try {
      const res = await returnApi.receiveReturn(receiveModal.returnId);
      if (res.data.isSuccess) {
        toast.success("Xác nhận đã nhận hàng thành công");
        closeReceiveModal();
        fetchReturns();
      } else {
        toast.error(res.data.message || "Không thể xác nhận nhận hàng");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi xác nhận nhận hàng");
    } finally {
      setReceiving(false);
    }
  };

  // ── Resolve handlers ───────────────────────────────────────────────────────
  const openResolveModal = (returnId: string) => {
    setResolveRestock(true);
    setResolveNote("");
    setResolveModal({ open: true, returnId });
  };

  const closeResolveModal = () => setResolveModal({ open: false, returnId: null });

  const handleResolve = async () => {
    if (!resolveModal.returnId) return;
    setResolving(true);
    try {
      const res = await returnApi.resolveReturn(resolveModal.returnId, {
        restock: resolveRestock,
        note: resolveNote || null,
      });
      if (res.data.isSuccess) {
        toast.success("Xử lý hoàn tất thành công");
        closeResolveModal();
        fetchReturns();
      } else {
        toast.error(res.data.message || "Không thể xử lý hoàn tất");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi xử lý hoàn tất");
    } finally {
      setResolving(false);
    }
  };

  // ── Complete Refund handlers ───────────────────────────────────────────────
  const openCompleteRefundModal = (returnId: string) => {
    setCompleteRefundModal({ open: true, returnId });
  };

  const closeCompleteRefundModal = () => setCompleteRefundModal({ open: false, returnId: null });

  const handleCompleteRefund = async () => {
    if (!completeRefundModal.returnId) return;
    setCompletingRefund(true);
    try {
      const res = await returnApi.completeRefund(completeRefundModal.returnId);
      if (res.data.isSuccess) {
        toast.success("Đã xác nhận hoàn tiền thành công");
        closeCompleteRefundModal();
        fetchReturns();
      } else {
        toast.error(res.data.message || "Không thể xác nhận hoàn tiền");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi xác nhận hoàn tiền");
    } finally {
      setCompletingRefund(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Yêu cầu trả hàng</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Xem và quản lý các yêu cầu trả hàng / hoàn tiền.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Đang tải danh sách...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageX className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-900">Không có yêu cầu trả hàng nào</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Loại</th>
                  <th className="p-4">Lý do</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Số lượng</th>
                  <th className="p-4">Tiền hoàn</th>
                  <th className="p-4">Ngày yêu cầu</th>
                  <th className="p-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {returns.map((item) => {
                  const isPending = item.status === PENDING_STATUS;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => openDetailModal(item.id)}
                      className="hover:bg-gray-50/30 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-mono font-medium text-gray-900">
                        #{item.deliveryId.substring(0, 8)}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-gray-800">{item.type}</span>
                      </td>
                      <td className="p-4 text-gray-600">{item.reason}</td>
                      <td className="p-4">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${RETURN_STATUS_META[item.status].className}`}
                        >
                          {RETURN_STATUS_META[item.status].label}
                        </span>
                      </td>
                      <td className="p-4 text-center">{item.itemCount}</td>
                      <td className="p-4 font-bold text-gray-900">
                        {item.refundAmount > 0 ? formatVnd(item.refundAmount) : "-"}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {formatOrderDate(item.createdAt)}
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetailModal(item.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Xem
                          </button>
                          {isPending && (
                            <>
                              <button
                                onClick={() => openApproveModal(item.id)}
                                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Duyệt
                              </button>
                              <button
                                onClick={() => openRejectModal(item.id)}
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                                Từ chối
                              </button>
                            </>
                          )}
                          {item.status === "ReturnInTransit" && (
                            <button
                              onClick={() => openReceiveModal(item.id)}
                              className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-600 hover:bg-teal-100 transition-colors cursor-pointer"
                            >
                              <PackageCheck className="h-3.5 w-3.5" />
                              Nhận hàng
                            </button>
                          )}
                          {item.status === "ItemReceived" && (
                            <button
                              onClick={() => openResolveModal(item.id)}
                              className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer"
                            >
                              <Banknote className="h-3.5 w-3.5" />
                              Đồng ý hoàn tiền
                            </button>
                          )}
                          {item.status === "Refunding" && (
                            <button
                              onClick={() => openCompleteRefundModal(item.id)}
                              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Xác nhận đã chuyển khoản
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      {detailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/60">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Chi tiết yêu cầu trả hàng
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5 font-mono">
                  {returnDetail ? `#${returnDetail.id}` : "Đang tải..."}
                </h3>
              </div>
              <button
                onClick={closeDetailModal}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {loadingDetail ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !returnDetail ? (
                <p className="py-10 text-center text-sm text-gray-400">Không tìm thấy thông tin.</p>
              ) : (
                <>
                  {/* Overview */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <p className="text-xs text-gray-400">Trạng thái</p>
                      <span
                        className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${RETURN_STATUS_META[returnDetail.status].className}`}
                      >
                        {RETURN_STATUS_META[returnDetail.status].label}
                      </span>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <p className="text-xs text-gray-400">Hình thức</p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {RETURN_TYPE_LABEL[returnDetail.type] ?? returnDetail.type}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <p className="text-xs text-gray-400">Số tiền hoàn</p>
                      <p className="mt-1 text-sm font-bold text-orange-600">
                        {returnDetail.refundAmount > 0 ? formatVnd(returnDetail.refundAmount) : "-"}
                      </p>
                    </div>
                  </div>

                  {/* IDs */}
                  <div className="grid grid-cols-1 gap-2 text-xs text-gray-500 sm:grid-cols-2">
                    <p>
                      Mã đơn hàng:{" "}
                      <span className="font-mono text-gray-700">{returnDetail.orderId}</span>
                    </p>
                    <p>
                      Mã giao hàng:{" "}
                      <span className="font-mono text-gray-700">{returnDetail.deliveryId}</span>
                    </p>
                    <p>
                      Khách hàng:{" "}
                      <span className="font-mono text-gray-700">{returnDetail.customerId}</span>
                    </p>
                    <p>
                      Ngày tạo:{" "}
                      <span className="text-gray-700">
                        {formatOrderDate(returnDetail.createdAt)}
                      </span>
                    </p>
                  </div>

                  {/* Reason */}
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Lý do</p>
                    <p className="text-sm font-medium text-gray-800">
                      {REASON_LABEL[returnDetail.reason] ?? returnDetail.reason}
                    </p>
                    {returnDetail.reasonDetail && (
                      <p className="mt-1.5 text-sm text-gray-500">{returnDetail.reasonDetail}</p>
                    )}
                    {returnDetail.rejectedReason && (
                      <div className="mt-2 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2">
                        <p className="text-xs font-semibold text-red-500">Lý do từ chối</p>
                        <p className="text-sm text-red-600 mt-0.5">{returnDetail.rejectedReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Sản phẩm trả</p>
                    <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                      {returnDetail.items.map((it) => (
                        <div key={it.id} className="flex items-center gap-3 p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {it.productName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatVnd(it.unitPrice)} x {it.quantity}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-gray-900">
                            {formatVnd(it.lineTotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bank info (only for Refund) */}
                  {returnDetail.type === "Refund" &&
                    (returnDetail.bankAccountName ||
                      returnDetail.bankAccountNumber ||
                      returnDetail.bankName) && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-1.5">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                          Thông tin tài khoản ngân hàng
                        </p>
                        <p className="text-sm text-gray-700">
                          Chủ tài khoản:{" "}
                          <span className="font-medium">{returnDetail.bankAccountName || "-"}</span>
                        </p>
                        <p className="text-sm text-gray-700">
                          Số tài khoản:{" "}
                          <span className="font-medium">
                            {returnDetail.bankAccountNumber || "-"}
                          </span>
                        </p>
                        <p className="text-sm text-gray-700">
                          Ngân hàng:{" "}
                          <span className="font-medium">{returnDetail.bankName || "-"}</span>
                        </p>
                        {returnDetail.refundMethod && (
                          <p className="text-sm text-gray-700">
                            Phương thức hoàn tiền:{" "}
                            <span className="font-medium">{returnDetail.refundMethod}</span>
                          </p>
                        )}
                      </div>
                    )}

                  {/* Images */}
                  {returnDetail.imageUrls.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Hình ảnh</p>
                      <div className="flex flex-wrap gap-2">
                        {returnDetail.imageUrls.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={`return-img-${idx}`}
                              className="h-20 w-20 rounded-lg object-cover border border-gray-100"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status logs / timeline */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Lịch sử trạng thái</p>
                    <div className="space-y-3">
                      {returnDetail.statusLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100">
                              <Clock className="h-3.5 w-3.5 text-orange-500" />
                            </div>
                            {idx !== returnDetail.statusLogs.length - 1 && (
                              <div className="w-px flex-1 bg-gray-100 mt-1" />
                            )}
                          </div>
                          <div className="pb-3">
                            <p className="text-sm font-semibold text-gray-800">
                              {log.fromStatus
                                ? `${log.fromStatus} → ${log.toStatus}`
                                : log.toStatus}
                            </p>
                            {log.note && <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatOrderDate(log.changedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer: quick actions when pending */}
            {returnDetail && returnDetail.status === PENDING_STATUS && (
              <div className="flex gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                <button
                  onClick={() => {
                    closeDetailModal();
                    openRejectModal(returnDetail.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  Từ chối
                </button>
                <button
                  onClick={() => {
                    closeDetailModal();
                    openApproveModal(returnDetail.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Duyệt
                </button>
              </div>
            )}
            
            {returnDetail && returnDetail.status === "ReturnInTransit" && (
              <div className="flex gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                <button
                  onClick={() => {
                    closeDetailModal();
                    openReceiveModal(returnDetail.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors cursor-pointer"
                >
                  <PackageCheck className="h-4 w-4" />
                  Xác nhận đã nhận hàng
                </button>
              </div>
            )}
            
            {returnDetail && returnDetail.status === "ItemReceived" && (
              <div className="flex gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                <button
                  onClick={() => {
                    closeDetailModal();
                    openResolveModal(returnDetail.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 transition-colors cursor-pointer"
                >
                  <Banknote className="h-4 w-4" />
                  Đồng ý hoàn tiền
                </button>
              </div>
            )}
            
            {returnDetail && returnDetail.status === "Refunding" && (
              <div className="flex gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                <button
                  onClick={() => {
                    closeDetailModal();
                    openCompleteRefundModal(returnDetail.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  <CreditCard className="h-4 w-4" />
                  Xác nhận đã chuyển khoản
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Approve Confirm Modal ──────────────────────────────────────────── */}
      {approveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Duyệt yêu cầu trả hàng?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Yêu cầu sẽ được chuyển sang trạng thái "Đã duyệt".
                </p>
              </div>
            </div>
            <div className="px-6 py-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Ghi chú (tuỳ chọn)
              </label>
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Thêm ghi chú cho yêu cầu này..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200 transition-all resize-none"
              />
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeApproveModal}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {approving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang duyệt...
                  </>
                ) : (
                  "Xác nhận duyệt"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Confirm Modal ───────────────────────────────────────────── */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Từ chối yêu cầu trả hàng?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vui lòng nêu lý do từ chối để khách hàng được biết.
                </p>
              </div>
            </div>
            <div className="px-6 py-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Sản phẩm không đủ điều kiện trả hàng theo chính sách..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-200 transition-all resize-none"
              />
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeRejectModal}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang từ chối...
                  </>
                ) : (
                  "Xác nhận từ chối"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receive Confirm Modal ──────────────────────────────────────────── */}
      {receiveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50">
                <PackageCheck className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Xác nhận nhận hàng?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Bạn xác nhận đã nhận được hàng trả từ khách? Trạng thái sẽ chuyển sang "Đã nhận hàng".
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4">
              <button
                onClick={closeReceiveModal}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleReceive}
                disabled={receiving}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {receiving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resolve Confirm Modal ──────────────────────────────────────────── */}
      {resolveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50">
                <Banknote className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Đồng ý hoàn tiền?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Xác nhận hoàn tất xử lý và bắt đầu quá trình hoàn tiền/đổi hàng cho khách.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resolveRestock}
                  onChange={(e) => setResolveRestock(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">Nhập lại kho sản phẩm này</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Ghi chú (tuỳ chọn)
                </label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Ghi chú xử lý..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeResolveModal}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {resolving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete Refund Confirm Modal ────────────────────────────────────── */}
      {completeRefundModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Xác nhận đã hoàn tiền?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Bạn xác nhận đã chuyển khoản thành công cho khách hàng theo thông tin trên?
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4">
              <button
                onClick={closeCompleteRefundModal}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCompleteRefund}
                disabled={completingRefund}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {completingRefund ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
