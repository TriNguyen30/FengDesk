import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/types/api";
import type { CreateVoucherPayload, PagedVouchers, Voucher } from "../types/voucher";

/** Quản lý mã giảm giá — chỉ Manager/Admin (BE trả 403 cho Staff). */
export const voucherApi = {
  list: async (page: number, pageSize: number) => {
    const { data } = await fetchHttpClient.get<ApiResponse<PagedVouchers>>("/vouchers", {
      params: { page, pageSize },
    });
    return data;
  },

  create: async (payload: CreateVoucherPayload) => {
    const { data } = await fetchHttpClient.post<ApiResponse<Voucher>>("/vouchers", payload);
    return data;
  },

  setActive: async (id: string, isActive: boolean) => {
    const { data } = await fetchHttpClient.patch<ApiResponse<Voucher>>(`/vouchers/${id}/active`, {
      isActive,
    });
    return data;
  },
};
