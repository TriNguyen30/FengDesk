import { useState, useEffect, useCallback } from "react";
import { Loader2, PackageX, Check, X, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { returnApi } from "@/features/return/api/return.api";
import type { ReturnItem } from "@/features/return/types/return.d.ts";
import { formatVnd, formatOrderDate } from "@/features/orders/utils/orderUtils";
import { useQueryClient } from "@tanstack/react-query";

const PENDING_STATUS = "Requested";

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

export default function ManageOrderReturnPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Approve modal
  const [approveModal, setApproveModal] = useState<ApproveModalState>({ open: false, returnId: null });
  const [approveNote, setApproveNote] = useState("");
  const [approving, setApproving] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<RejectModalState>({ open: false, returnId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

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
      const res = await returnApi.approveReturn(approveModal.returnId, { note: approveNote || null });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Yêu cầu trả hàng</h1>
          <p className="text-gray-500 mt-1 text-sm">Xem và quản lý các yêu cầu trả hàng / hoàn tiền.</p>
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
                    <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="p-4 font-mono font-medium text-gray-900">
                        #{item.deliveryId.substring(0, 8)}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-gray-800">{item.type}</span>
                      </td>
                      <td className="p-4 text-gray-600">{item.reason}</td>
                      <td className="p-4">
                        <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${
                          item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          item.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                          item.status === 'Cancelled' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">{item.itemCount}</td>
                      <td className="p-4 font-bold text-gray-900">
                        {item.refundAmount > 0 ? formatVnd(item.refundAmount) : '-'}
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {formatOrderDate(item.createdAt)}
                      </td>
                      <td className="p-4">
                        {isPending ? (
                          <div className="flex items-center gap-2">
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
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ghi chú (tuỳ chọn)</label>
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
    </div>
  );
}