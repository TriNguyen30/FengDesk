/** Tương ứng `VoucherResponse` của BE (docs/api-documents/28-vouchers.md). */
export interface Voucher {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: "FreeShipping";
  fundedBy: "Platform";
  minOrderSubtotal: number;
  maxDiscountAmount?: number | null;
  provinceId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  usedCount: number;
  isAutoApply: boolean;
  isActive: boolean;
}

export interface CreateVoucherPayload {
  code: string;
  name: string;
  description?: string;
  minOrderSubtotal: number;
  maxDiscountAmount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  isAutoApply: boolean;
}

export interface PagedVouchers {
  items: Voucher[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
