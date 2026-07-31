import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { model3DApi } from "@/features/products/api/model3d.api";
import type { ProductDetail } from "@/features/products/types/product";
import type {
  Model3DRequest,
  Model3DRequestStatus,
  ProductModel3D,
} from "@/features/products/types/model3d";
import { OPEN_MODEL3D_REQUEST_STATUSES } from "@/features/products/types/model3d";

const MAX_IMAGES = 4;

interface ProductModel3DSectionProps {
  productId: string;
  images: ProductDetail["images"];
  onRefreshProduct: () => void;
}

const REQUEST_STATUS_LABEL: Record<Model3DRequestStatus, string> = {
  Queued: "Đang chờ xử lý",
  Processing: "Đang tạo (tự động)",
  AwaitingStaff: "Chờ sàn xử lý",
  InProgress: "Sàn đang xử lý",
  Succeeded: "Hoàn tất",
  Failed: "Thất bại",
  Rejected: "Đã từ chối",
};

const REQUEST_STATUS_STYLE: Record<Model3DRequestStatus, string> = {
  Queued: "bg-amber-50 text-amber-700",
  Processing: "bg-blue-50 text-blue-700",
  AwaitingStaff: "bg-amber-50 text-amber-700",
  InProgress: "bg-blue-50 text-blue-700",
  Succeeded: "bg-green-50 text-green-700",
  Failed: "bg-red-50 text-red-700",
  Rejected: "bg-gray-100 text-gray-500",
};

export function ProductModel3DSection({ productId, images, onRefreshProduct }: ProductModel3DSectionProps) {
  const [model, setModel] = useState<ProductModel3D | null>(null);
  const [requests, setRequests] = useState<Model3DRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const [modelRes, requestsRes] = await Promise.all([
        model3DApi.getModel3D(productId).catch(() => null), // 404 = chưa có model — không phải lỗi
        model3DApi.listModel3DRequests(productId).catch(() => null),
      ]);
      setModel(modelRes?.data?.isSuccess ? modelRes.data.data : null);
      setRequests(requestsRes?.data?.isSuccess ? requestsRes.data.data : []);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const openRequest = useMemo(
    () => requests.find((r) => OPEN_MODEL3D_REQUEST_STATUSES.includes(r.status)),
    [requests],
  );

  // Server quyết định Initial/Regenerate dựa trên model hiện tại có Succeeded hay chưa — mirror lại
  // ở FE để biết có cần hiện picker chọn ảnh hay không (Regenerate: staff sàn tự chọn ảnh sau).
  const isRegenerate = model?.status === "Succeeded";

  const totalSelected = selectedImageIds.length + newFiles.length;

  const resetPicker = () => {
    setSelectedImageIds([]);
    setNewFiles([]);
    setShowPicker(false);
  };

  const toggleExistingImage = (imageId: string) => {
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
    const incoming = Array.from(files);
    const room = MAX_IMAGES - totalSelected;
    if (room <= 0) {
      toast.error(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh`);
      return;
    }
    setNewFiles((prev) => [...prev, ...incoming.slice(0, room)]);
  };

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRequestInitial = () => setShowPicker(true);

  const handleSubmitInitial = async () => {
    if (totalSelected === 0) {
      toast.error("Chọn ít nhất 1 ảnh (ảnh có sẵn hoặc upload mới)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await model3DApi.requestModel3D(productId, {
        sourceImageIds: selectedImageIds,
        newImageFiles: newFiles,
      });
      if (res.data.isSuccess) {
        toast.success(res.data.message || "Đã tạo yêu cầu — hệ thống sẽ tự tạo mô hình 3D");
        resetPicker();
        load();
        onRefreshProduct();
      } else {
        toast.error(res.data.message || "Tạo yêu cầu thất bại");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi tạo yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRegenerate = async () => {
    setSubmitting(true);
    try {
      const res = await model3DApi.requestModel3D(productId, {});
      if (res.data.isSuccess) {
        toast.success(res.data.message || "Đã gửi yêu cầu tạo lại — đội ngũ sàn sẽ xử lý thủ công");
        load();
        onRefreshProduct();
      } else {
        toast.error(res.data.message || "Tạo yêu cầu thất bại");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi tạo yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (nextEnabled: boolean) => {
    setToggling(true);
    try {
      const res = await model3DApi.toggleModel3D(productId, nextEnabled);
      if (res.data.isSuccess) {
        setModel((m) => (m ? { ...m, isEnabled: nextEnabled } : m));
        toast.success(nextEnabled ? "Đã bật hiển thị mô hình 3D" : "Đã tắt hiển thị mô hình 3D");
        onRefreshProduct();
      } else {
        toast.error(res.data.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Trạng thái model hiện tại ──────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Box size={18} className="text-primary" />
          <h2 className="text-base font-bold text-gray-950">Mô hình 3D sản phẩm</h2>
        </div>

        {!model ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
            <Box size={32} className="stroke-1 text-gray-300 mb-2" />
            <p className="text-sm">Chưa có mô hình 3D nào được tạo cho sản phẩm này.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="h-24 w-24 shrink-0 rounded-xl bg-gray-50 ring-1 ring-gray-100 overflow-hidden flex items-center justify-center">
              {model.thumbnailUrl ? (
                <img src={model.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Box size={28} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <ModelStatusBadge status={model.status} />
                {model.status === "Processing" && (
                  <span className="text-xs text-gray-400">{model.progress}%</span>
                )}
              </div>
              {model.errorMessage && (
                <p className="text-xs text-red-500">{model.errorMessage}</p>
              )}

              {model.status === "Succeeded" && (
                <button
                  type="button"
                  onClick={() => handleToggle(!model.isEnabled)}
                  disabled={toggling}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
                    model.isEnabled
                      ? "border-primary text-primary hover:bg-primary/5"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {toggling ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : model.isEnabled ? (
                    <Eye size={14} />
                  ) : (
                    <EyeOff size={14} />
                  )}
                  {model.isEnabled ? "Đang hiển thị trên trang sản phẩm" : "Đang ẩn — bấm để hiển thị lại"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Tạo yêu cầu ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-base font-bold text-gray-950">
            {isRegenerate ? "Tạo lại mô hình 3D" : "Tạo mô hình 3D"}
          </h2>
        </div>

        {openRequest ? (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <Clock size={16} className="shrink-0" />
            <span>
              Đang có 1 yêu cầu chưa hoàn tất —{" "}
              <span className="font-semibold">{REQUEST_STATUS_LABEL[openRequest.status]}</span>.
            </span>
          </div>
        ) : isRegenerate ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Sản phẩm đã có mô hình 3D. Muốn tạo lại (chưa ưng ý kết quả hiện tại)? Yêu cầu sẽ được
              đội ngũ sàn xử lý thủ công — họ sẽ tự chọn ảnh phù hợp.
            </p>
            <button
              type="button"
              onClick={handleRequestRegenerate}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Gửi yêu cầu tạo lại
            </button>
          </div>
        ) : showPicker ? (
          <ImagePicker
            images={images}
            selectedImageIds={selectedImageIds}
            onToggleImage={toggleExistingImage}
            newFiles={newFiles}
            onAddFiles={handleAddFiles}
            onRemoveNewFile={removeNewFile}
            totalSelected={totalSelected}
            submitting={submitting}
            onCancel={resetPicker}
            onSubmit={handleSubmitInitial}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Chọn ảnh sản phẩm để hệ thống tự động tạo mô hình 3D (qua AI). Bỏ trống sẽ dùng ảnh đầu
              tiên của sản phẩm.
            </p>
            <button
              type="button"
              onClick={handleRequestInitial}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              Tạo yêu cầu tạo mô hình 3D
            </button>
          </div>
        )}
      </div>

      {/* ── Lịch sử request ─────────────────────────────────────────────── */}
      {requests.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Lịch sử yêu cầu
          </h3>
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">
                    {r.requestType === "Initial" ? "Tạo lần đầu" : "Tạo lại"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${REQUEST_STATUS_STYLE[r.status]}`}
                >
                  {REQUEST_STATUS_LABEL[r.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelStatusBadge({ status }: { status: ProductModel3D["status"] }) {
  const map: Record<ProductModel3D["status"], { label: string; className: string; Icon: typeof Clock }> = {
    Pending: { label: "Đang chờ", className: "bg-amber-50 text-amber-700", Icon: Clock },
    Processing: { label: "Đang tạo", className: "bg-blue-50 text-blue-700", Icon: Loader2 },
    Succeeded: { label: "Hoàn tất", className: "bg-green-50 text-green-700", Icon: CheckCircle2 },
    Failed: { label: "Thất bại", className: "bg-red-50 text-red-700", Icon: XCircle },
  };
  const { label, className, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      <Icon size={12} className={status === "Processing" ? "animate-spin" : undefined} />
      {label}
    </span>
  );
}

interface ImagePickerProps {
  images: ProductDetail["images"];
  selectedImageIds: string[];
  onToggleImage: (id: string) => void;
  newFiles: File[];
  onAddFiles: (files: FileList | null) => void;
  onRemoveNewFile: (idx: number) => void;
  totalSelected: number;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function ImagePicker({
  images,
  selectedImageIds,
  onToggleImage,
  newFiles,
  onAddFiles,
  onRemoveNewFile,
  totalSelected,
  submitting,
  onCancel,
  onSubmit,
}: ImagePickerProps) {
  const sorted = [...(images || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const atLimit = totalSelected >= MAX_IMAGES;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Chọn 1–{MAX_IMAGES} ảnh. Mẹo: chụp ảnh sản phẩm ở nhiều góc độ khác nhau sẽ cho ra mô hình 3D
        chính xác hơn.
      </p>

      {sorted.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {sorted.map((img) => {
            const selected = selectedImageIds.includes(img.id);
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onToggleImage(img.id)}
                disabled={!selected && atLimit}
                className={`relative aspect-square rounded-xl overflow-hidden ring-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                  selected ? "ring-primary" : "ring-gray-100 hover:ring-gray-300"
                }`}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {selected && (
                  <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {newFiles.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {newFiles.map((file, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden ring-2 ring-primary/50">
              <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveNewFile(idx)}
                className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white cursor-pointer hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-medium transition-colors ${
          atLimit
            ? "border-gray-100 text-gray-300 cursor-not-allowed"
            : "border-gray-200 text-gray-500 hover:border-primary hover:bg-primary/5 cursor-pointer"
        }`}
      >
        <Upload size={16} />
        Tải ảnh mới lên
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={atLimit}
          onChange={(e) => {
            onAddFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>

      {totalSelected === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle size={13} /> Chọn ít nhất 1 ảnh để tiếp tục.
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || totalSelected === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Gửi yêu cầu ({totalSelected}/{MAX_IMAGES} ảnh)
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
