import { useQuery } from "@tanstack/react-query";
import { getMyStoreBalanceRequest } from "../api/shop.api";

export const MY_STORE_BALANCE_KEY = ["my-store-balance"] as const;

/**
 * Số dư các cửa hàng mình sở hữu — cho menu tài khoản. Chỉ tải khi `enabled` (menu đang mở và user là chủ cửa
 * hàng) để không tốn một lượt DB mỗi lần tải trang; cache 1 phút vì tiền chỉ đổi khi có đơn giao/hoàn.
 */
export function useMyStoreBalance(enabled: boolean) {
  const query = useQuery({
    queryKey: MY_STORE_BALANCE_KEY,
    queryFn: async () => {
      const res = await getMyStoreBalanceRequest();
      if (!res.isSuccess || !res.data) throw new Error(res.message || "Không tải được số dư");
      return res.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
  return { balance: query.data, isLoading: query.isLoading, isError: query.isError };
}
