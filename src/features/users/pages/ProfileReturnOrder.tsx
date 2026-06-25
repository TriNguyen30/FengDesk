import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Loader2, PackageX, ChevronRight, RefreshCw, Ban } from "lucide-react";
import { toast } from "sonner";
import { returnApi } from "@/features/return/api/return.api";
import type { ReturnItem } from "@/features/return/types/return.d.ts";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const RETURN_TYPE_LABEL: Record<string, string> = {
  Refund: "Hoàn tiền",
  Exchange: "Đổi hàng",
};

const RETURN_STATUS_META: Record<string, { label: string; className: string }> = {
  Requested:    { label: "Đã gửi yêu cầu",      className: "bg-amber-50 text-amber-600 border border-amber-200" },
  Approved:   { label: "Đã duyệt",        className: "bg-indigo-50 text-indigo-600 border border-indigo-200" },
  Rejected:   { label: "Bị từ chối",      className: "bg-red-50 text-red-500 border border-red-200" },
  Processing: { label: "Đang xử lý",      className: "bg-blue-50 text-blue-600 border border-blue-200" },
  Completed:  { label: "Hoàn tất",        className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  Cancelled:  { label: "Đã hủy",          className: "bg-gray-100 text-gray-500 border border-gray-200" },
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileReturnOrder() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Cancel confirm state
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

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

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (!loading && returns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <PackageX className="h-8 w-8 text-orange-300" />
        </div>
        <p className="text-base font-semibold text-gray-700">Chưa có yêu cầu trả hàng nào</p>
        <p className="mt-1 text-sm text-gray-400">Các yêu cầu trả hàng / hoàn tiền sẽ hiện ở đây.</p>
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
            const statusMeta =
              RETURN_STATUS_META[item.status] ?? {
                label: item.status,
                className: "bg-gray-100 text-gray-500 border border-gray-200",
              };
            const canCancel = CANCELLABLE_STATUSES.includes(item.status);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
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
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-50 pt-3">
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
    </div>
  );
}