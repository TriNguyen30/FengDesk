import fetchHttpClient from "@/lib/httpClient";
import type {
  ReturnQueryParams,
  ReturnListResponse,
  ReturnDetailResponse,
  CreateReturnRequest,
  CreateReturnResponse,
  CancelReturnResponse,
  RejectReturnRequest,
  RejectReturnResponse,
  AcceptReturnResponse,
} from "@/features/return/types/return.d.ts";

export const returnApi = {
  getAllReturns: async (params?: ReturnQueryParams) => {
    return fetchHttpClient.get<ReturnListResponse>("/returns/all", params);
  },

  getMyReturns: async (params?: ReturnQueryParams) => {
    return fetchHttpClient.get<ReturnListResponse>("/returns/mine", params);
  },

  getStoreReturns: async (storeId: string, params?: ReturnQueryParams) => {
    return fetchHttpClient.get<ReturnListResponse>(`/returns/stores/${storeId}`, params);
  },

  getReturnById: async (returnId: string) => {
    return fetchHttpClient.get<ReturnDetailResponse>(`/returns/${returnId}`);
  },

  createReturn: async (payload: CreateReturnRequest) => {
    return fetchHttpClient.post<CreateReturnResponse>("/returns", payload);
  },

  cancelReturn: async (returnId: string) => {
    return fetchHttpClient.post<CancelReturnResponse>(`/returns/${returnId}/cancel`, {});
  },

  rejectReturn: async (returnId: string, payload?: RejectReturnRequest) => {
    return fetchHttpClient.post<RejectReturnResponse>(`/returns/${returnId}/reject`, payload ?? {});
  },

  acceptReturn: async (returnId: string) => {
    return fetchHttpClient.post<AcceptReturnResponse>(`/returns/${returnId}/accept`);
  },
};
