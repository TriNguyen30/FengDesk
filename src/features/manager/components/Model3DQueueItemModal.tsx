import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
  AlertTriangle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Product3DViewer from "@/components/ui/3DSection";
import { productApi } from "@/features/products/api/product.api";
import { model3DQueueApi } from "@/features/products/api/model3dQueue.api";
import type { ProductImage } from "@/features/products/types/product";
import type { Model3DPreview, Model3DRequestQueueItem } from "@/features/products/types/model3d";

const MAX_IMAGES = 4;

const FAILURE_REASON_LABEL: Record<string, string> = {
  InsufficientCredits: "Meshy đã hết credit",
  GenerationFailed: "Meshy tạo model thất bại",
  InvalidImage: "Ảnh nguồn không hợp lệ",
};

interface Model3DQueueItemModalProps {
  item: Model3DRequestQueueItem | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function Model3DQueueItemModal({ item, onClose, onChanged }: Model3DQueueItemModalProps) {
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [preview, setPreview] = useState<Model3DPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const open = !!item;

  // Reset state mỗi khi mở một item khác. Cả Initial và Regenerate đều thao tác thủ công.
  useEffect(() => {
    setProductImages([]);
    setShowPicker(item?.status === "AwaitingStaff" || item?.status === "Failed");
    const initialIds = item?.sourceImageIds?.length
      ? [...item.sourceImageIds]
      : item?.productImageId ? [item.productImageId] : [];
    if (item?.productImageId && !initialIds.includes(item.productImageId)) initialIds.unshift(item.productImageId);
    setSelectedImageIds([...initialIds]);
    setNewFiles([]);
    setPreview(null);
    setShowRejectInput(false);
    setRejectReason("");

    if (item) {
      setLoadingImages(true);
      productApi
        .getProductById(item.productId)
        .then((res) => {
          if (res.data.isSuccess && res.data.data) {
            setProductImages(res.data.data.images || []);
            setSelectedImageIds([...initialIds]);
          }
        })
        .catch(() => toast.error("Không tải được ảnh sản phẩm"))
        .finally(() => setLoadingImages(false));
    }
  }, [item]);

  const totalSelected = selectedImageIds.length + newFiles.length;

  const toggleExistingImage = (imageId: string) => {
    if (imageId === item?.productImageId) return;
    setSelectedImageIds((prev) => {
      if (prev.includes(imageId)) return prev.filter((id) => id !== imageId);
      if (totalSelected >= MAX_IMAGES) {
        toast.error(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh`);
        return prev;
      }
      return [...prev, imageId];
    });
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - totalSelected;
    if (room <= 0) {
      toast.error(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh`);
      return;
    }
    setNewFiles((prev) => [...prev, ...Array.from(files).slice(0, room)]);
  };

  const removeNewFile = (idx: number) => setNewFiles((prev) => prev.filter((_, i) => i !== idx));

  const isRetryFlow = item?.status === "InProgress" || item?.status === "Failed";

  const handleGenerateOrRetry = async () => {
    if (!item || totalSelected === 0) {
      toast.error("Chọn ít nhất 1 ảnh");
      return;
    }
    setSubmitting(true);
    try {
      const call = isRetryFlow ? model3DQueueApi.retry : model3DQueueApi.generate;
      const res = await call(item.id, {
        productImageId: item.productImageId ?? undefined,
        sourceImageIds: selectedImageIds,
        newImageFiles: newFiles,
      });
      if (res.data.isSuccess) {
        toast.success(res.data.message || "Đã gửi yêu cầu tới Meshy");
        onChanged();
        onClose();
      } else {
        toast.error(res.data.message || "Gửi thất bại");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi gửi yêu cầu tới Meshy");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = async () => {
    if (!item) return;
    setPreviewLoading(true);
    try {
      const res = await model3DQueueApi.preview(item.id);
      if (res.data.isSuccess) {
        setPreview(res.data.data);
        if (res.data.data.state === "Failed") onChanged();
      } else {
        toast.error(res.data.message || "Không xem trước được");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi xem trước");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!item || item.status !== "InProgress" || showPicker || (preview && preview.state !== "Running")) return;
    handlePreview();
    const interval = window.setInterval(handlePreview, 5_000);
    return () => window.clearInterval(interval);
    // item id/status and picker state are the lifecycle boundaries for polling this Meshy task.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, item?.status, showPicker, preview?.state]);

  const handleAccept = async () => {
    if (!item) return;
    setSubmitting(true);
    try {
      const res = await model3DQueueApi.accept(item.id);
      if (res.data.isSuccess) {
        toast.success(res.data.message || "Đã áp dụng model 3D cho sản phẩm");
        onChanged();
        onClose();
      } else {
        toast.error(res.data.message || "Chấp nhận thất bại");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi chấp nhận");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!item) return;
    if (!rejectReason.trim()) {
      toast.error("Nhập lý do từ chối");
      return;
    }
    setSubmitting(true);
    try {
      const res = await model3DQueueApi.reject(item.id, rejectReason.trim());
      if (res.data.isSuccess) {
        toast.success(res.data.message || "Đã từ chối yêu cầu");
        onChanged();
        onClose();
      } else {
        toast.error(res.data.message || "Từ chối thất bại");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi từ chối");
    } finally {
      setSubmitting(false);
    }
  };

  const sortedImages = useMemo(
    () => [...productImages].sort((a, b) => a.sortOrder - b.sortOrder),
    [productImages],
  );

  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="max-w-2xl"
      title={
        <div>
          <h2 className="text-base font-bold text-gray-900">{item.productName}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{item.storeName}</p>
        </div>
      }
    >
      <div className="space-y-5">
        {item.productImageUrl && (
          <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3 ring-1 ring-primary/10">
            <img
              src={item.productImageUrl}
              alt="Ảnh đại diện của model"
              className="h-14 w-14 rounded-lg object-cover ring-1 ring-gray-100"
            />
            <div>
              <p className="text-xs font-semibold text-gray-700">Model sẽ được lưu cho ảnh này</p>
              <p className="mt-0.5 text-xs text-gray-400">Có thể chọn thêm ảnh cùng kiểu dáng ở góc khác.</p>
            </div>
          </div>
        )}
        {item.internalFailureReason && item.status !== "Succeeded" && item.status !== "Rejected" && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Lần xử lý trước chưa thành công</p>
              <p className="mt-0.5 text-xs">{FAILURE_REASON_LABEL[item.internalFailureReason] || item.internalFailureReason}</p>
            </div>
          </div>
        )}
        {item.status === "Succeeded" ? (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check size={16} /> Đã áp dụng model 3D cho sản phẩm.
          </div>
        ) : item.status === "Rejected" ? (
          <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <p className="font-medium">Đã từ chối yêu cầu này.</p>
            {item.rejectedReason && <p className="mt-1 text-gray-500">Lý do: {item.rejectedReason}</p>}
          </div>
        ) : (
          <>
            {/* ── AwaitingStaff / InProgress: picker + actions ─────────────── */}
            {showPicker ? (
              loadingImages ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400">
                    Chọn 1–{MAX_IMAGES} ảnh để gửi Meshy tạo model 3D.
                  </p>

                  {sortedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2.5">
                      {sortedImages.map((img) => {
                        const selected = selectedImageIds.includes(img.id);
                        return (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => toggleExistingImage(img.id)}
                            disabled={!selected && totalSelected >= MAX_IMAGES}
                            className={`relative aspect-square rounded-lg overflow-hidden ring-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                              selected ? "ring-primary" : "ring-gray-100 hover:ring-gray-300"
                            }`}
                          >
                            <img src={img.url} alt="" className="h-full w-full object-cover" />
                            {selected && (
                              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                                <Check size={10} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {newFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2.5">
                      {newFiles.map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden ring-2 ring-primary/50">
                          <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeNewFile(idx)}
                            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-2.5 text-xs font-medium transition-colors ${
                      totalSelected >= MAX_IMAGES
                        ? "border-gray-100 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-gray-500 hover:border-primary hover:bg-primary/5 cursor-pointer"
                    }`}
                  >
                    <Upload size={14} />
                    Tải ảnh mới
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={totalSelected >= MAX_IMAGES}
                      onChange={(e) => {
                        handleAddFiles(e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleGenerateOrRetry}
                      disabled={submitting || totalSelected === 0}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all cursor-pointer disabled:opacity-60"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isRetryFlow ? "Gửi lại Meshy" : "Bắt đầu tạo"} ({totalSelected}/{MAX_IMAGES})
                    </button>
                    {isRetryFlow && (
                      <button
                        type="button"
                        onClick={() => setShowPicker(false)}
                        disabled={submitting}
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-60"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowRejectInput((value) => !value)}
                      disabled={submitting}
                      className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-60"
                    >
                      Từ chối
                    </button>
                  </div>
                  {showRejectInput && (
                    <div className="space-y-2 rounded-xl border border-red-100 bg-red-50/50 p-3">
                      <label className="text-xs font-semibold text-gray-700">Lý do từ chối</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        placeholder="VD: Ảnh nguồn không đủ rõ hoặc không cùng một kiểu dáng..."
                      />
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={submitting || !rejectReason.trim()}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer disabled:opacity-60"
                      >
                        Xác nhận từ chối
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              <>
                {/* ── InProgress: preview + accept/retry/reject ────────────── */}
                {!preview ? (
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all cursor-pointer disabled:opacity-60"
                  >
                    {previewLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                    Xem trước kết quả
                  </button>
                ) : preview.state === "Running" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      <Loader2 size={16} className="animate-spin shrink-0" />
                      Meshy đang xử lý... {preview.progress}%
                    </div>
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={previewLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw size={13} className={previewLoading ? "animate-spin" : undefined} />
                      Kiểm tra lại
                    </button>
                  </div>
                ) : preview.state === "Succeeded" && preview.glbUrl ? (
                  <div className="space-y-3">
                    <div className="aspect-square w-full max-w-xs mx-auto rounded-xl overflow-hidden ring-1 ring-gray-100 bg-gray-50">
                      <Product3DViewer modelUrl={preview.glbUrl} thumbnailUrl={preview.thumbnailUrl} autoRotate />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAccept}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-green-700 transition-all cursor-pointer disabled:opacity-60"
                      >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                        Chấp nhận
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-60"
                      >
                        <RotateCcw size={16} />
                        Tạo lại
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(true)}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-60"
                      >
                        <ThumbsDown size={16} />
                        Từ chối
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertTriangle size={16} className="shrink-0" />
                      {preview.error || "Meshy tạo model thất bại."}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark cursor-pointer"
                      >
                        <RotateCcw size={16} />
                        Tạo lại
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <ThumbsDown size={16} />
                        Từ chối
                      </button>
                    </div>
                  </div>
                )}

                {showRejectInput && (
                  <div className="space-y-2 rounded-xl border border-red-100 bg-red-50/50 p-3">
                    <label className="text-xs font-semibold text-gray-700">Lý do từ chối</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      maxLength={1000}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="VD: Ảnh nguồn không đủ rõ, sản phẩm không phù hợp để tạo model 3D..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={submitting}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer disabled:opacity-60"
                      >
                        Xác nhận từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(false)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
