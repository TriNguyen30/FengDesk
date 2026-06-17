import fetchHttpClient from "@/lib/httpClient";
import { ApiResponse } from "@/types/api";
import type {
  CancelPaymentRequest,
  CancelPaymentApiResponse,
  CreatePaymentApiResponse,
  PaymentStatusApiResponse,
  SimulatePaidApiResponse,
} from "../types/payment";

export const paymentApi = {
  // POST /api/payments/{orderId}
  createPayment: (orderId: string) => {
    return fetchHttpClient.post<CreatePaymentApiResponse>(`/payments/${orderId}`);
  },

  // GET /api/payments/{orderId}
  getPaymentStatus: (orderId: string) => {
    return fetchHttpClient.get<PaymentStatusApiResponse>(`/payments/${orderId}`);
  },

  // POST /api/payments/{orderId}/cancel
  cancelPayment: (orderId: string, payload?: CancelPaymentRequest) => {
    return fetchHttpClient.post<CancelPaymentApiResponse>(`/payments/${orderId}/cancel`, payload);
  },

  // POST /api/payments/payos/webhook
  payosWebhook: (payload: any) => {
    return fetchHttpClient.post<ApiResponse<any>>("/payments/payos/webhook", payload);
  },

  // POST /api/payments/{orderId}/dev/mark-paid
  simulatePaid: (orderId: string) => {
    return fetchHttpClient.post<SimulatePaidApiResponse>(`/payments/${orderId}/dev/mark-paid`);
  },
};
export default paymentApi;
