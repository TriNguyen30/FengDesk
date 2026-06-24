import fetchHttpClient from "@/lib/httpClient";
import type { ReturnQueryParams, ReturnListResponse, CreateReturnRequest, CreateReturnResponse } from "@/features/return/types/return.d.ts";

export const returnApi = {
  getAllReturns: async (params?: ReturnQueryParams) => {
    return fetchHttpClient.get<ReturnListResponse>("/returns/all", params);
  },

  createReturn: async (payload: CreateReturnRequest) => {
    return fetchHttpClient.post<CreateReturnResponse>("/returns", payload);
  },
};
