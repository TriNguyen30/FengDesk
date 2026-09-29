import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { voucherApi } from "../api/voucher.api";
import type { CreateVoucherPayload } from "../types/voucher";

const VOUCHERS_KEY = ["manager-vouchers"] as const;

/** Lỗi axios mang message tiếng Việt của BE trong phong bì — ưu tiên hiện đúng lý do BE trả. */
export function voucherErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })
    ?.response;
  if (response?.status === 403) return "Chỉ Quản lý hoặc Quản trị viên được quản lý mã giảm giá.";
  return response?.data?.message || fallback;
}

export function useVoucherList(page: number, pageSize = 20) {
  const query = useQuery({
    queryKey: [...VOUCHERS_KEY, page, pageSize],
    queryFn: async () => {
      const res = await voucherApi.list(page, pageSize);
      if (!res.isSuccess) throw new Error(res.message || "Không tải được mã giảm giá");
      return res.data;
    },
    retry: false,
  });
  return { data: query.data, isLoading: query.isLoading, error: query.error };
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVoucherPayload) => voucherApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VOUCHERS_KEY }),
  });
}

export function useSetVoucherActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      voucherApi.setActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOUCHERS_KEY });
      // Mã tắt/bật ảnh hưởng ưu đãi hiển thị ở trang thanh toán.
      queryClient.invalidateQueries({ queryKey: ["available-vouchers"] });
    },
  });
}
