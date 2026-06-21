import fetchHttpClient from "@/lib/httpClient";
import type {
  CreateOrders,
  CreateOrderResponse,
  GetDeliveriesResponse,
  GetOrderDetailResponse,
  GetOrdersParams,
  GetOrdersResponse,
  UpdateDeliveryStatusParams,
  UpdateDeliveryStatusResponse,
  ApiResponse,
  OrderDetail,
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

  getStoreDeliveries: (storeId: string, params?: GetOrdersParams) => {
    return fetchHttpClient.get<GetDeliveriesResponse>(
      `/orders/stores/${storeId}/deliveries`,
      params,
    );
  },

  updateDeliveryStatus: (deliveryId: string, data: UpdateDeliveryStatusParams) => {
    return fetchHttpClient.patch<UpdateDeliveryStatusResponse>(
      `/orders/deliveries/${deliveryId}/status`,
      data,
    );
  },
};
