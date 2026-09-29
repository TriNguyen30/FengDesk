import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/types/api";
import type {
  PlatformFeePolicy,
  PlatformFeeRateHistory,
  UpdatePlatformFeePayload,
} from "../types/platform-fee";

/** Phí sàn — xem công khai, đổi và xem lịch sử cần Manager/Admin (BE trả 403 cho Staff). */
export const platformFeeApi = {
  update: async (payload: UpdatePlatformFeePayload) => {
    const { data } = await fetchHttpClient.put<ApiResponse<PlatformFeePolicy>>(
      "/platform/fee-policy",
      payload,
    );
    return data;
  },

  history: async () => {
    const { data } = await fetchHttpClient.get<ApiResponse<PlatformFeeRateHistory[]>>(
      "/platform/fee-policy/history",
    );
    return data;
  },
};
