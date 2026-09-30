import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FEE_POLICY_KEY } from "@/features/shop/hooks/usePlatformFeePolicy";
import { platformFeeApi } from "../api/platform-fee.api";
import type { UpdatePlatformFeePayload } from "../types/platform-fee";

const HISTORY_KEY = ["platform-fee-history"] as const;

/** Lỗi axios mang message tiếng Việt của BE trong phong bì — ưu tiên hiện đúng lý do BE trả. */
export function platformFeeErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })
    ?.response;
  if (response?.status === 403) return "Chỉ Quản lý hoặc Quản trị viên được đổi phí sàn.";
  return response?.data?.message || fallback;
}

export function usePlatformFeeHistory() {
  const query = useQuery({
    queryKey: HISTORY_KEY,
    queryFn: async () => {
      const res = await platformFeeApi.history();
      if (!res.isSuccess) throw new Error(res.message || "Không tải được lịch sử phí sàn");
      return res.data;
    },
    retry: false,
  });
  return { history: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

export function useUpdatePlatformFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePlatformFeePayload) => platformFeeApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
      // Ô nhập giá của người bán và thẻ thống kê đọc tỉ lệ từ đây.
      queryClient.invalidateQueries({ queryKey: FEE_POLICY_KEY });
    },
  });
}
