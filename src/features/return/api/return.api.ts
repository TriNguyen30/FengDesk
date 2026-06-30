import fetchHttpClient from "@/lib/httpClient";
import type {
  ReturnQueryParams,
  ReturnListResponse,
  ReturnDetailResponse,
  CreateReturnRequest,
  CreateReturnResponse,
  CancelReturnResponse,
  ApproveReturnRequest,
  ApproveReturnResponse,
  RejectReturnRequest,
  RejectReturnResponse,
  ShipBackRequest,
  ShipBackResponse,
  ResolveReturnRequest,
  ResolveReturnResponse,
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

  approveReturn: async (returnId: string, payload?: ApproveReturnRequest) => {
    return fetchHttpClient.post<ApproveReturnResponse>(
      `/returns/${returnId}/approve`,
      payload ?? {},
    );
  },

  rejectReturn: async (returnId: string, payload?: RejectReturnRequest) => {
    return fetchHttpClient.post<RejectReturnResponse>(`/returns/${returnId}/reject`, payload ?? {});
  },

  shipBack: async (returnId: string, payload?: ShipBackRequest) => {
    return fetchHttpClient.post<ShipBackResponse>(`/returns/${returnId}/ship-back`, payload ?? {});
  },

  receiveReturn: async (returnId: string) => {
    return fetchHttpClient.post<ReturnDetailResponse>(`/returns/${returnId}/receive`, {});
  },

  resolveReturn: async (returnId: string, payload: ResolveReturnRequest) => {
    return fetchHttpClient.post<ResolveReturnResponse>(`/returns/${returnId}/resolve`, payload);
  },

  completeRefund: async (returnId: string) => {
    return fetchHttpClient.post<ReturnDetailResponse>(`/returns/${returnId}/complete-refund`, {});
  },
};
