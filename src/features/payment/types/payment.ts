import { ApiResponse } from "@/types/api";

export type PaymentStatus = "Pending" | "Paid" | "Cancelled" | "Failed" | "Expired";

export interface CreatePaymentResponse {
  orderId: string;
  orderCode: number;
  amount: number;
  checkoutUrl: string;
  qrCode: string | null;
  paymentLinkId: string;
  status: PaymentStatus;
}

export interface CancelPaymentRequest {
  reason?: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  orderStatus: string;
  orderCode: number | null;
  paymentStatus: PaymentStatus | null;
  amount: number | null;
  providerTransactionId: string | null;
  paidAt: string | null;
}

export type CreatePaymentApiResponse = ApiResponse<CreatePaymentResponse>;
export type PaymentStatusApiResponse = ApiResponse<PaymentStatusResponse>;
export type CancelPaymentApiResponse = ApiResponse<any>;
export type SimulatePaidApiResponse = ApiResponse<any>;
