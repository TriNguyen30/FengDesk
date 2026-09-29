import { useQuery } from "@tanstack/react-query";
import { getPlatformFeePolicyRequest } from "../api/shop.api";

export const FEE_POLICY_KEY = ["platform-fee-policy"] as const;

/** Chính sách phí sàn — Manager đổi được nên chỉ cache ngắn; trang quản trị phí xoá cache ngay khi lưu. */
export function usePlatformFeePolicy() {
  const query = useQuery({
    queryKey: FEE_POLICY_KEY,
    queryFn: async () => {
      const res = await getPlatformFeePolicyRequest();
      if (!res.isSuccess || !res.data)
        throw new Error(res.message || "Không tải được chính sách phí sàn");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { policy: query.data, isLoading: query.isLoading, isError: query.isError };
}
