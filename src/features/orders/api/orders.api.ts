import fetchHttpClient from "@/lib/httpClient";
import type {
  CreateOrders,
  CreateOrderResponse,
  GetOrderDetailResponse,
  GetOrdersParams,
  GetOrdersResponse,
  ApiResponse,
  OrderDetail,
  UpdateDeliveryStatusRequest,
} from "../types/orders";

export const ordersApi = {
  createOrder: (payload: CreateOrders) => {
    return fetchHttpClient.post<CreateOrderResponse>("/orders", payload);
  },

  getOrders: (params?: GetOrdersParams) => {
    return fetchHttpClient.get<GetOrdersResponse>("/orders", params);
  },

  getAllOrders: (params?: GetOrdersParams) => {
    return fetchHttpClient.get<GetOrdersResponse>("/orders/all", params);
  },

  getOrderById: (id: string) => {
    return fetchHttpClient.get<GetOrderDetailResponse>(`/orders/${id}`);
  },

  cancelOrder: (id: string) => {
    return fetchHttpClient.post<ApiResponse<OrderDetail>>(`/orders/${id}/cancel`);
  },
  updateDeliveryStatus: (deliveryId: string, payload: UpdateDeliveryStatusRequest) => {
    return fetchHttpClient.patch<ApiResponse<any>>(
      `/orders/deliveries/${deliveryId}/status`,
      payload,
    );
  },
};
