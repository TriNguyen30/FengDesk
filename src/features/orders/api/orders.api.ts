import fetchHttpClient from "@/lib/httpClient";
import type {
  CreateOrders,
  CreateOrderResponse,
  CreateShipmentResponse,
  GetOrderDetailResponse,
  GetOrdersParams,
  GetOrdersResponse,
  GetStoreDeliveriesResponse,
  ApiResponse,
  OrderDetail,
  PreviewShippingFeePayload,
  ShippingFeePreview,
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

  /** Garden owner/staff: danh sách delivery của một store (paged). */
  getStoreDeliveries: (storeId: string, params?: GetOrdersParams) => {
    return fetchHttpClient.get<GetStoreDeliveriesResponse>(
      `/orders/stores/${storeId}/deliveries`,
      params,
    );
  },

  /** Garden owner/staff: bấm "Tạo đơn ship" sau khi đã Nhận đơn (delivery đang Confirmed). */
  createDeliveryShipment: (deliveryId: string) => {
    return fetchHttpClient.post<CreateShipmentResponse>(
      `/orders/deliveries/${deliveryId}/shipment`,
    );
  },

  previewShippingFee: (payload: PreviewShippingFeePayload) => {
    return fetchHttpClient.post<ApiResponse<ShippingFeePreview>>(
      "/orders/shipping-fee-preview",
      payload,
    );
  },
};
