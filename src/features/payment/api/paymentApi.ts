import fetchHttpClient from "@/lib/httpClient";
import type {
  CancelPaymentRequest,
  CancelPaymentApiResponse,
  CreatePaymentApiResponse,
  PaymentStatusApiResponse,
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
};
export default paymentApi;
