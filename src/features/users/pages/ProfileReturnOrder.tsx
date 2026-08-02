import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  PackageX,
  ChevronRight,
  RefreshCw,
  Ban,
  Eye,
  X,
  Package,
  Clock,
  Upload,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { returnApi } from "@/features/return/api/return.api";
import type { ReturnItem, ReturnDetail } from "@/features/return/types/return.d.ts";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const getReturnTypeLabel = (t: any): Record<string, string> => ({
  Refund: t("profile_return_order.types.refund"),
  Exchange: t("profile_return_order.types.exchange"),
});

const getReasonLabel = (t: any): Record<string, string> => ({
  Defective: t("profile_return_order.reasons.defective"),
  WrongItem: t("profile_return_order.reasons.wrong_item"),
  NotAsDescribed: t("profile_return_order.reasons.not_as_described"),
  DamagedInTransit: t("profile_return_order.reasons.damaged"),
  ChangedMind: t("profile_return_order.reasons.changed_mind"),
  Other: t("profile_return_order.reasons.other"),
});

const getReturnStatusMeta = (t: any): Record<string, { label: string; className: string }> => ({
  Requested: {
    label: t("profile_return_order.statuses.requested"),
    className: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  Reviewing: {
    label: "Đang xem xét",
    className: "bg-indigo-50 text-indigo-600 border border-indigo-200",
  },
  NeedMoreEvidence: {
    label: "Đang chờ bổ sung bằng chứng",
    className: "bg-orange-50 text-orange-600 border border-orange-200",
  },
  ItemReceived: {
    label: t("profile_return_order.statuses.item_received"),
    className: "bg-purple-50 text-purple-600 border border-purple-200",
  },
  Refunding: {
    label: t("profile_return_order.statuses.refunding"),
    className: "bg-orange-50 text-orange-600 border border-orange-200",
  },
  Rejected: { label: t("profile_return_order.statuses.rejected"), className: "bg-red-50 text-red-500 border border-red-200" },
  Processing: { label: t("profile_return_order.statuses.processing"), className: "bg-blue-50 text-blue-600 border border-blue-200" },
  Completed: {
    label: t("profile_return_order.statuses.completed"),
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  Cancelled: { label: t("profile_return_order.statuses.cancelled"), className: "bg-gray-100 text-gray-500 border border-gray-200" },
  ReturnInTransit: {
    label: t("profile_return_order.statuses.return_in_transit"),
    className: "bg-sky-50 text-sky-600 border border-sky-200",
  },
});

const CANCELLABLE_STATUSES = ["Requested"];
const RESUBMIT_STATUSES = ["NeedMoreEvidence"];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

function getStatusMeta(status: string, t: any) {
  return (
    getReturnStatusMeta(t)[status] ?? {
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

// ─── Animation variants ──────────────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileReturnOrder() {
  const { t } = useTranslation();
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

  // Resubmit evidence state
  const [resubmitModal, setResubmitModal] = useState<{ open: boolean; returnId: string | null }>({
    open: false,
    returnId: null,
  });
  const [resubmitFiles, setResubmitFiles] = useState<File[]>([]);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchReturns = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await returnApi.getMyReturns({ Page: p, PageSize: PAGE_SIZE });
      if (res.data.isSuccess) {
        setReturns(res.data.data.items);
        setTotalPages(res.data.data.totalPages);
      } else {
        toast.error(res.data.message || t("profile_return_order.toast.load_list_error"));
      }
    } catch {
      toast.error(t("profile_return_order.toast.load_list_exception"));
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
        toast.success(t("profile_return_order.toast.cancel_success"));
        setCancelId(null);
        fetchReturns(page);
      } else {
        toast.error(res.data.message || t("profile_return_order.toast.cancel_error"));
      }
    } catch {
      toast.error(t("profile_return_order.toast.cancel_exception"));
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
        toast.error(res.data.message || t("profile_return_order.toast.load_detail_error"));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("profile_return_order.toast.load_detail_exception"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModal({ open: false, returnId: null });
    setReturnDetail(null);
  };

  // ── Resubmit evidence handlers ─────────────────────────────────────────
  const openResubmitModal = (returnId: string) => {
    setResubmitModal({ open: true, returnId });
    setResubmitFiles([]);
    setDragOver(false);
  };

  const closeResubmitModal = () => {
    setResubmitModal({ open: false, returnId: null });
    setResubmitFiles([]);
    setDragOver(false);
  };

  const validateAndAddFiles = (incoming: File[]) => {
    const valid: File[] = [];
    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" không phải định dạng ảnh hợp lệ`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" vượt quá 5 MB`);
        continue;
      }
      valid.push(file);
    }
    setResubmitFiles((prev) => {
      const combined = [...prev, ...valid];
      if (combined.length > MAX_FILES) {
        toast.error(`Chỉ được tải tối đa ${MAX_FILES} ảnh`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setResubmitFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResubmitEvidence = async () => {
    if (!resubmitModal.returnId || resubmitFiles.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 ảnh bằng chứng");
      return;
    }
    setSubmittingEvidence(true);
    try {
      const res = await returnApi.resubmitEvidence(resubmitModal.returnId, resubmitFiles);
      if (res.data.isSuccess) {
        toast.success("Đã bổ sung bằng chứng thành công");
        closeResubmitModal();
        fetchReturns(page);
        // If detail modal was open for same item, refresh it
        if (detailModal.open && detailModal.returnId === resubmitModal.returnId) {
          setReturnDetail(res.data.data);
        }
      } else {
        toast.error(res.data.message || "Không thể bổ sung bằng chứng");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi bổ sung bằng chứng");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (!loading && returns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <PackageX className="h-8 w-8 text-orange-300" />
        </div>
        <p className="text-base font-semibold text-gray-700">{t("profile_return_order.empty.title")}</p>
        <p className="mt-1 text-sm text-gray-400">
          {t("profile_return_order.empty.desc")}
        </p>
        <Link
          to="/profile/orders"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          {t("profile_return_order.empty.btn")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Title row */}
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">{t("profile_return_order.title")}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {t("profile_return_order.desc")}
        </p>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((item) => {
            const statusMeta = getStatusMeta(item.status, t);
            const canCancel = CANCELLABLE_STATUSES.includes(item.status);
            const canResubmit = RESUBMIT_STATUSES.includes(item.status);

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
                      {t("profile_return_order.list.order_num")}{item.deliveryId.slice(0, 8).toUpperCase()}
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
                    {getReturnTypeLabel(t)[item.type] ?? item.type}
                  </span>
                  <span>{t("profile_return_order.list.reason")}{getReasonLabel(t)[item.reason] ?? item.reason}</span>
                  <span>{item.itemCount}{t("profile_return_order.list.products")}</span>
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
                    {t("profile_return_order.list.view_detail")}
                  </button>
                  {canResubmit && (
                    <button
                      onClick={() => openResubmitModal(item.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Bổ sung bằng chứng
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => setCancelId(item.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      {t("profile_return_order.list.cancel_req")}
                    </button>
                  )}
                  <Link
                    to={`/profile/orders/${item.orderId}`}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {t("profile_return_order.list.view_order")}
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
            {t("profile_return_order.pagination.prev")}
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
            {t("profile_return_order.pagination.next")}
          </button>
        </div>
      )}

      {/* Cancel confirm modal */}
      <AnimatePresence>
        {cancelId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setCancelId(null)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-[101] w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden"
            >
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{t("profile_return_order.cancel_modal.title")}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("profile_return_order.cancel_modal.desc")}
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t("profile_return_order.cancel_modal.no")}
              </button>
              <button
                onClick={handleCancelReturn}
                disabled={cancelling}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("profile_return_order.cancel_modal.cancelling")}
                  </>
                ) : (
                  t("profile_return_order.cancel_modal.confirm")
                )}
              </button>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeDetailModal}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-[101] w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
            >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-orange-50/60">
              <div>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">
                  {t("profile_return_order.detail_modal.tag")}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5 font-mono">
                  {returnDetail ? `#${returnDetail.id.slice(0, 8).toUpperCase()}` : t("profile_return_order.detail_modal.loading")}
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
                <p className="py-10 text-center text-sm text-gray-400">{t("profile_return_order.detail_modal.not_found")}</p>
              ) : (
                <>
                  {/* Overview */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <p className="text-xs text-gray-400">{t("profile_return_order.detail_modal.status")}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusMeta(returnDetail.status, t).className}`}
                      >
                        {getStatusMeta(returnDetail.status, t).label}
                      </span>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <p className="text-xs text-gray-400">{t("profile_return_order.detail_modal.type")}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {getReturnTypeLabel(t)[returnDetail.type] ?? returnDetail.type}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <p className="text-xs text-gray-400">{t("profile_return_order.detail_modal.refund_amount")}</p>
                      <p className="mt-1 text-sm font-bold text-orange-600">
                        {returnDetail.refundAmount > 0 ? formatVnd(returnDetail.refundAmount) : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Ngày tạo */}
                  <p className="text-xs text-gray-500">
                    {t("profile_return_order.detail_modal.created_at")} {" "}
                    <span className="text-gray-700 font-medium">
                      {formatDate(returnDetail.createdAt)}
                    </span>
                  </p>

                  {/* Reason */}
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-600 mb-1">{t("profile_return_order.detail_modal.reason")}</p>
                    <p className="text-sm font-medium text-gray-800">
                      {getReasonLabel(t)[returnDetail.reason] ?? returnDetail.reason}
                    </p>
                    {returnDetail.reasonDetail && (
                      <p className="mt-1.5 text-sm text-gray-500">{returnDetail.reasonDetail}</p>
                    )}
                    {returnDetail.rejectedReason && (
                      <div className="mt-2 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2">
                        <p className="text-xs font-semibold text-red-500">{t("profile_return_order.detail_modal.rejected_reason")}</p>
                        <p className="text-sm text-red-600 mt-0.5">{returnDetail.rejectedReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">{t("profile_return_order.detail_modal.return_items")}</p>
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
                          {t("profile_return_order.detail_modal.bank_info")}
                        </p>
                        <p className="text-sm text-gray-700">
                          {t("profile_return_order.detail_modal.account_name")} {" "}
                          <span className="font-medium">{returnDetail.bankAccountName || "-"}</span>
                        </p>
                        <p className="text-sm text-gray-700">
                          {t("profile_return_order.detail_modal.account_number")} {" "}
                          <span className="font-medium">
                            {returnDetail.bankAccountNumber || "-"}
                          </span>
                        </p>
                        <p className="text-sm text-gray-700">
                          {t("profile_return_order.detail_modal.bank_name")} {" "}
                          <span className="font-medium">{returnDetail.bankName || "-"}</span>
                        </p>
                        {returnDetail.refundMethod && (
                          <p className="text-sm text-gray-700">
                            {t("profile_return_order.detail_modal.refund_method")} {" "}
                            <span className="font-medium">{returnDetail.refundMethod}</span>
                          </p>
                        )}
                      </div>
                    )}

                  {/* Images */}
                  {returnDetail.imageUrls.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">{t("profile_return_order.detail_modal.images")}</p>
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
                    <p className="text-xs font-semibold text-gray-600 mb-2">{t("profile_return_order.detail_modal.history")}</p>
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
                                ? `${getReturnStatusMeta(t)[log.fromStatus]?.label ?? log.fromStatus} → ${getReturnStatusMeta(t)[log.toStatus]?.label ?? log.toStatus}`
                                : (getReturnStatusMeta(t)[log.toStatus]?.label ?? log.toStatus)}
                            </p>
                            {log.note && <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(log.changedAt)}
                            </p>
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
              {returnDetail && RESUBMIT_STATUSES.includes(returnDetail.status) && (
                <button
                  onClick={() => {
                    openResubmitModal(returnDetail.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Bổ sung bằng chứng
                </button>
              )}
              {returnDetail && CANCELLABLE_STATUSES.includes(returnDetail.status) && (
                <button
                  onClick={() => {
                    closeDetailModal();
                    setCancelId(returnDetail.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Ban className="h-4 w-4" />
                  {t("profile_return_order.detail_modal.cancel")}
                </button>
              )}
              <button
                onClick={closeDetailModal}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t("profile_return_order.detail_modal.close")}
              </button>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Resubmit Evidence Modal ────────────────────────────────────────── */}
      {resubmitModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-orange-50/60">
              <div>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">
                  Bổ sung bằng chứng
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">
                  Tải lên hình ảnh bổ sung
                </h3>
              </div>
              <button
                onClick={closeResubmitModal}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">
                Vui lòng tải lên hình ảnh bổ sung để hỗ trợ yêu cầu trả hàng của bạn.
                Tối đa {MAX_FILES} ảnh, mỗi ảnh không quá 5 MB.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${
                  dragOver
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 bg-gray-50/50 hover:border-orange-300 hover:bg-orange-50/30"
                }`}
              >
                <ImagePlus className={`h-8 w-8 ${dragOver ? "text-orange-500" : "text-gray-300"}`} />
                <p className="text-sm font-medium text-gray-600">
                  Kéo thả ảnh vào đây hoặc <span className="text-orange-500 underline">chọn file</span>
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF — tối đa 5 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* File preview list */}
              {resubmitFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600">
                    Đã chọn {resubmitFiles.length}/{MAX_FILES} ảnh
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {resubmitFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="group relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() => removeFile(idx)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={closeResubmitModal}
                disabled={submittingEvidence}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={handleResubmitEvidence}
                disabled={submittingEvidence || resubmitFiles.length === 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submittingEvidence ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Gửi bằng chứng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
