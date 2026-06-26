import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Loader2, PackageX, ChevronRight, RefreshCw, Ban, Eye, X, Package, Clock } from "lucide-react";
import { toast } from "sonner";
import { returnApi } from "@/features/return/api/return.api";
import type { ReturnItem, ReturnDetail } from "@/features/return/types/return.d.ts";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

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
  Requested: {
    label: "Đã gửi yêu cầu",
    className: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  Approved: {
    label: "Đã duyệt",
    className: "bg-indigo-50 text-indigo-600 border border-indigo-200",
  },
  Rejected: { label: "Bị từ chối", className: "bg-red-50 text-red-500 border border-red-200" },
  Processing: { label: "Đang xử lý", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  Completed: {
    label: "Hoàn tất",
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  Cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-500 border border-gray-200" },
};

const CANCELLABLE_STATUSES = ["Requested"];

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusMeta(status: string) {
  return (
    RETURN_STATUS_META[status] ?? {
      label: status,
      className: "bg-gray-100 text-gray-500 border border-gray-200",
    }
  );
}

// ── Detail modal state ───────────────────────────────────────────────────────
interface DetailModalState {
  open: boolean;
  returnId: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileReturnOrder() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Cancel confirm state
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Detail modal state
  const [detailModal, setDetailModal] = useState<DetailModalState>({ open: false, returnId: null });
  const [returnDetail, setReturnDetail] = useState<ReturnDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchReturns = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await returnApi.getMyReturns({ Page: p, PageSize: PAGE_SIZE });
      if (res.data.isSuccess) {
        setReturns(res.data.data.items);
        setTotalPages(res.data.data.totalPages);
      } else {
        toast.error(res.data.message || "Không thể tải danh sách yêu cầu");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns(page);
  }, [fetchReturns, page]);

  const handleCancelReturn = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const res = await returnApi.cancelReturn(cancelId);
      if (res.data.isSuccess) {
        toast.success("Đã hủy yêu cầu trả hàng");
        setCancelId(null);
        fetchReturns(page);
      } else {
        toast.error(res.data.message || "Không thể hủy yêu cầu");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi hủy yêu cầu");
    } finally {
      setCancelling(false);
    }
  };

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

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (!loading && returns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <PackageX className="h-8 w-8 text-orange-300" />
        </div>
        <p className="text-base font-semibold text-gray-700">Chưa có yêu cầu trả hàng nào</p>
        <p className="mt-1 text-sm text-gray-400">
          Các yêu cầu trả hàng / hoàn tiền sẽ hiện ở đây.
        </p>
        <Link
          to="/profile/orders"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          Xem đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Title row */}
      <div className="mb-5 flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-bold text-gray-900">Yêu cầu trả hàng</h2>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((item) => {
            const statusMeta = getStatusMeta(item.status);
            const canCancel = CANCELLABLE_STATUSES.includes(item.status);

            return (
              <div
                key={item.id}
                onClick={() => openDetailModal(item.id)}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Top row: id + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-mono">
                      #{item.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-700">
                      Đơn #{item.deliveryId.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                {/* Meta row */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 text-orange-400" />
                    {RETURN_TYPE_LABEL[item.type] ?? item.type}
                  </span>
                  <span>Lý do: {item.reason}</span>
                  <span>{item.itemCount} sản phẩm</span>
                  {item.refundAmount > 0 && (
                    <span className="font-semibold text-orange-600">
                      {formatVnd(item.refundAmount)}
                    </span>
                  )}
                  <span className="ml-auto text-gray-400">{formatDate(item.createdAt)}</span>
                </div>

                {/* Action row */}
                <div
                  className="mt-3 flex items-center justify-end gap-2 border-t border-gray-50 pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openDetailModal(item.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Xem chi tiết
                  </button>
                  {canCancel && (
                    <button
                      onClick={() => setCancelId(item.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Hủy yêu cầu
                    </button>
                  )}
                  <Link
                    to={`/profile/orders/${item.orderId}`}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Xem đơn hàng
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
          >
            Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                p === page
                  ? "border-orange-300 bg-orange-50 text-orange-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
          >
            Sau
          </button>
        </div>
      )}

      {/* Cancel confirm modal */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Hủy yêu cầu trả hàng?</h3>
              <p className="mt-1 text-sm text-gray-500">
                Bạn có chắc muốn hủy yêu cầu này không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Không
              </button>
              <button
                onClick={handleCancelReturn}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  "Xác nhận hủy"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      {detailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-orange-50/60">
              <div>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">
                  Chi tiết yêu cầu trả hàng
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5 font-mono">
                  {returnDetail ? `#${returnDetail.id.slice(0, 8).toUpperCase()}` : "Đang tải..."}
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
                  <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                </div>
              ) : !returnDetail ? (
                <p className="py-10 text-center text-sm text-gray-400">Không tìm thấy thông tin.</p>
              ) : (
                <>
                  {/* Overview */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <p className="text-xs text-gray-400">Trạng thái</p>
                      <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusMeta(returnDetail.status).className}`}>
                        {getStatusMeta(returnDetail.status).label}
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

                  {/* Ngày tạo */}
                  <p className="text-xs text-gray-500">
                    Ngày tạo: <span className="text-gray-700 font-medium">{formatDate(returnDetail.createdAt)}</span>
                  </p>

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
                            <p className="text-sm font-medium text-gray-900 truncate">{it.productName}</p>
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
                  {returnDetail.type === "Refund" && (returnDetail.bankAccountName || returnDetail.bankAccountNumber || returnDetail.bankName) && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-1.5">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                        Thông tin tài khoản ngân hàng
                      </p>
                      <p className="text-sm text-gray-700">Chủ tài khoản: <span className="font-medium">{returnDetail.bankAccountName || "-"}</span></p>
                      <p className="text-sm text-gray-700">Số tài khoản: <span className="font-medium">{returnDetail.bankAccountNumber || "-"}</span></p>
                      <p className="text-sm text-gray-700">Ngân hàng: <span className="font-medium">{returnDetail.bankName || "-"}</span></p>
                      {returnDetail.refundMethod && (
                        <p className="text-sm text-gray-700">Phương thức hoàn tiền: <span className="font-medium">{returnDetail.refundMethod}</span></p>
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
                            <img src={url} alt={`return-img-${idx}`} className="h-20 w-20 rounded-lg object-cover border border-gray-100" />
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
                              {log.fromStatus ? `${log.fromStatus} → ${log.toStatus}` : log.toStatus}
                            </p>
                            {log.note && <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.changedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
              {returnDetail && CANCELLABLE_STATUSES.includes(returnDetail.status) && (
                <button
                  onClick={() => {
                    closeDetailModal();
                    setCancelId(returnDetail.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Ban className="h-4 w-4" />
                  Hủy yêu cầu
                </button>
              )}
              <button
                onClick={closeDetailModal}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
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
