// ── List item (từ GET /returns/all) ─────────────────────────────────────────
export interface ReturnItem {
  id: string;
  orderId: string;
  deliveryId: string;
  type: "Refund" | "Exchange";
  status: string;
  reason: string;
  refundAmount: number;
  itemCount: number;
  createdAt: string;
}

// ── Detail item (từ POST /returns, POST /returns/{id}/cancel) ────────────────
export interface ReturnDetailItem {
  id: string;
  orderItemId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  exchangeProductItemId: string | null;
}

export interface ReturnStatusLog {
  fromStatus: string | null;
  toStatus: string;
  note: string;
  changedAt: string;
}

export interface ReturnDetail {
  id: string;
  orderId: string;
  deliveryId: string;
  customerId: string;
  type: "Refund" | "Exchange";
  status: string;
  reason: string;
  reasonDetail: string | null;
  refundAmount: number;
  refundMethod: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  returnTrackingCode: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  receivedAt: string | null;
  replacementDeliveryId: string | null;
  createdAt: string;
  items: ReturnDetailItem[];
  imageUrls: string[];
  statusLogs: ReturnStatusLog[];
  refund: any | null;
}

// ── Query / Request types ────────────────────────────────────────────────────
export interface ReturnListResponse {
  data: {
    items: ReturnItem[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}

export interface ReturnQueryParams {
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export type ReturnType = "Refund" | "Exchange";
export type ReturnReason =
  | "PlantHealth"
  | "WrongItem"
  | "DamagedPackage"
  | "NotAsDescribed";

export interface CreateReturnItemRequest {
  orderItemId: string;
  quantity: number;
  exchangeProductItemId?: string | null;
}

export interface CreateReturnRequest {
  deliveryId: string;
  type: ReturnType;
  reason: ReturnReason;
  reasonDetail?: string | null;
  items?: CreateReturnItemRequest[] | null;
  imageUrls?: string[] | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
}

// ── Approve / Reject request types (POST /returns/{id}/approve, /reject) ────
export interface RejectReturnRequest {
  reason?: string | null;
}

export interface RequestMoreEvidenceRequest {
  note?: string | null;
  deadlineHours?: number | null;
}

// ── Response types ───────────────────────────────────────────────────────────
export interface CreateReturnResponse {
  data: ReturnDetail;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}

export interface CancelReturnResponse {
  data: ReturnDetail;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}

export interface RejectReturnResponse {
  data: ReturnDetail;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}

export interface AcceptReturnResponse {
  data: ReturnDetail;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}

export interface ApproveRefundRequest {
  restock: boolean;
  note?: string | null;
}

export interface ApproveRefundResponse {
  data: ReturnDetail;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}

export interface RequestMoreEvidenceResponse {
  data: ReturnDetail;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}

export interface ResubmitEvidenceResponse {
  data: ReturnDetail;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}

// ── Detail response (từ GET /returns/{id}) ───────────────────────────────────
export interface ReturnDetailResponse {
  data: ReturnDetail;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}
