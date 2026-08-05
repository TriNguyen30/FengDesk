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
  RequestMoreEvidenceRequest,
  RequestMoreEvidenceResponse,
  ResubmitEvidenceResponse,
  ApproveRefundRequest,
  ApproveRefundResponse,
  ConfirmReceivedResponse,
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

  approveRefund: async (returnId: string, payload: ApproveRefundRequest) => {
    return fetchHttpClient.post<ApproveRefundResponse>(`/returns/${returnId}/approve-refund`, payload);
  },

  confirmReceived: async (returnId: string) => {
    return fetchHttpClient.post<ConfirmReceivedResponse>(`/returns/${returnId}/confirm-received`, {});
  },

  requestMoreEvidence: async (returnId: string, payload: RequestMoreEvidenceRequest) => {
    return fetchHttpClient.post<RequestMoreEvidenceResponse>(
      `/returns/${returnId}/request-more-evidence`,
      payload
    );
  },

  resubmitEvidence: async (returnId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    return fetchHttpClient.post<ResubmitEvidenceResponse>(
      `/returns/${returnId}/resubmit-evidence`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
};
