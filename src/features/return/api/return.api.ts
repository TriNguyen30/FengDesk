import fetchHttpClient from "@/lib/httpClient";

export interface ReturnItem {
  id: string;
  orderId: string;
  deliveryId: string;
  type: string;
  status: string;
  reason: string;
  refundAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface ReturnListResponse {
  data: {
    items: ReturnItem[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: any;
}

export interface ReturnQueryParams {
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export const returnApi = {
  getAllReturns: async (params?: ReturnQueryParams) => {
    return fetchHttpClient.get<ReturnListResponse>("/returns/all", params);
  },
};
