import type { ApiResponse, PaginatedResponse } from "@/features/orders/types/orders";

export interface Delivery {
  id: string;
  orderId: string;
  orderCode?: string;
  status: string;
  customerName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt?: string;
}

export type GetDeliveriesResponse = PaginatedResponse<Delivery>;

export interface UpdateDeliveryStatusParams {
  status: string;
}

export type UpdateDeliveryStatusResponse = ApiResponse<Delivery>;

export interface DeliveryProgress {
  id: string;
  deliveryId: string;
  status: string;
  location?: string;
  note?: string;
  timestamp: string;
}

export type GetDeliveryProgressResponse = ApiResponse<DeliveryProgress[]>;
