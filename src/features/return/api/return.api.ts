import fetchHttpClient from "@/lib/httpClient";
import type { 
    ReturnQueryParams, 
    ReturnListResponse, 
    CreateReturnRequest, 
    CreateReturnResponse, 
    CancelReturnResponse,
    ApproveReturnRequest,
    ApproveReturnResponse,
    RejectReturnRequest,
    RejectReturnResponse, 
 } 
from "@/features/return/types/return.d.ts";

export const returnApi = {
  getAllReturns: async (params?: ReturnQueryParams) => {
    return fetchHttpClient.get<ReturnListResponse>("/returns/all", params);
  },

  getMyReturns: async (params?: ReturnQueryParams) => {
    return fetchHttpClient.get<ReturnListResponse>("/returns/mine", params);
  },

  createReturn: async (payload: CreateReturnRequest) => {
    return fetchHttpClient.post<CreateReturnResponse>("/returns", payload);
  },

  cancelReturn: async (returnId: string) => {
    return fetchHttpClient.post<CancelReturnResponse>(`/returns/${returnId}/cancel`, {});
  },

  approveReturn: async (returnId: string, payload?: ApproveReturnRequest) => {
  return fetchHttpClient.post<ApproveReturnResponse>(`/returns/${returnId}/approve`, payload ?? {});
},

rejectReturn: async (returnId: string, payload?: RejectReturnRequest) => {
  return fetchHttpClient.post<RejectReturnResponse>(`/returns/${returnId}/reject`, payload ?? {});
},


};

