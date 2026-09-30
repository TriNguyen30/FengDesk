import type { PlatformFeePolicy } from "@/features/shop/types/shop";

/** `PUT /platform/fee-policy` — tỉ lệ dạng số thập phân (0.0825 = 8,25%). */
export interface UpdatePlatformFeePayload {
  commissionRate: number;
  note?: string;
}

/** Một dòng lịch sử phí sàn — `GET /platform/fee-policy/history`. */
export interface PlatformFeeRateHistory {
  id: string;
  commissionRate: number;
  effectiveFrom: string;
  note?: string | null;
  /** null = hệ thống (mức khởi tạo). */
  changedByName?: string | null;
}

export type { PlatformFeePolicy };
