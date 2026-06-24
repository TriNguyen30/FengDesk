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
  | "Defective"
  | "WrongItem"
  | "NotAsDescribed"
  | "DamagedInTransit"
  | "ChangedMind"
  | "Other";

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

export interface CreateReturnResponse {
  data: ReturnItem;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}