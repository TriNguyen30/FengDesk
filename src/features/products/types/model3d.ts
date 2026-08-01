// ============================================================
// Model 3D (Meshy AI) — trạng thái/kết quả hiện tại của 1 product.
// Khớp FengDeskAI.Application.Features.Catalog.DTOs.ProductModel3DResponse
// ============================================================

export type Model3DStatus = "Pending" | "Processing" | "Succeeded" | "Failed";

export interface ProductModel3D {
  id: string;
  productId: string;
  status: Model3DStatus;
  progress: number;
  sourceImageUrl: string;
  /** URL file GLB đã re-host trên storage. Null tới khi Succeeded. */
  modelUrl: string | null;
  thumbnailUrl: string | null;
  errorMessage: string | null;
  /** Toggle hiển thị của owner/garden staff — false thì FE ẩn hẳn phần 3D. */
  isEnabled: boolean;
  updatedAt: string;
}

// ============================================================
// Model3DRequest — hàng chờ + lịch sử (owner/garden staff).
// Khớp FengDeskAI.Application.Features.Catalog.DTOs.Model3DRequestResponse
// ============================================================

export type Model3DRequestType = "Initial" | "Regenerate";

/** Trạng thái đã che giấu lỗi hết credit — owner không bao giờ thấy lý do lỗi thật (nội bộ). */
export type Model3DRequestStatus =
  | "Queued"
  | "Processing"
  | "AwaitingStaff"
  | "InProgress"
  | "Succeeded"
  | "Failed"
  | "Rejected";

/** Các trạng thái coi là "đang mở" — chặn tạo request mới (chỉ 1 request mở/product). */
export const OPEN_MODEL3D_REQUEST_STATUSES: Model3DRequestStatus[] = [
  "Queued",
  "Processing",
  "AwaitingStaff",
  "InProgress",
];

export interface Model3DRequest {
  id: string;
  productId: string;
  requestType: Model3DRequestType;
  status: Model3DRequestStatus;
  createdAt: string;
  updatedAt: string;
}

/** Payload tạo request (Initial: cần ảnh; Regenerate: bỏ trống, staff sàn tự chọn ảnh sau). */
export interface RequestModel3DPayload {
  sourceImageIds?: string[];
  newImageFiles?: File[];
}

// ============================================================
// Hàng chờ staff sàn (/api/model3d-requests) — chỉ Staff/Manager/Admin.
// Khớp FengDeskAI.Application.Features.Catalog.DTOs.Model3DRequestQueueItemResponse
// ============================================================

/** Staff-only — lý do lỗi nội bộ, KHÔNG hiển thị cho garden owner. */
export type Model3DFailureReason = "InsufficientCredits" | "GenerationFailed" | "InvalidImage";

export interface Model3DRequestQueueItem {
  id: string;
  productId: string;
  productName: string;
  storeName: string;
  requestType: Model3DRequestType;
  status: Model3DRequestStatus;
  sourceImageIds: string[];
  meshyTaskId: string | null;
  assignedStaffId: string | null;
  internalFailureReason: Model3DFailureReason | null;
  nextAttemptAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Model3DRequestQueueResponse {
  items: Model3DRequestQueueItem[];
  total: number;
}

export type Model3DPreviewState = "Running" | "Succeeded" | "Failed";

/** Xem trước live (poll trực tiếp Meshy, không lưu DB) — GlbUrl là URL tạm, chỉ dùng để preview. */
export interface Model3DPreview {
  state: Model3DPreviewState;
  progress: number;
  thumbnailUrl: string | null;
  glbUrl: string | null;
  error: string | null;
}
