import fetchHttpClient from "@/lib/httpClient";
import type { GetOrdersParams } from "@/features/orders/types/orders";
import type {
  GetDeliveriesResponse,
  UpdateDeliveryStatusParams,
  UpdateDeliveryStatusResponse,
  GetDeliveryProgressResponse,
} from "../types/shipping";

export const shippingApi = {
  getStoreDeliveries: (storeId: string, params?: GetOrdersParams) => {
    return fetchHttpClient.get<GetDeliveriesResponse>(
      `/shipping/stores/${storeId}/deliveries`,
      params,
    );
  },

  updateDeliveryStatus: (deliveryId: string, data: UpdateDeliveryStatusParams) => {
    return fetchHttpClient.patch<UpdateDeliveryStatusResponse>(
      `/shipping/deliveries/${deliveryId}/status`,
      data,
    );
  },

  getDeliveryProgress: (deliveryId: string) => {
    return fetchHttpClient.get<GetDeliveryProgressResponse>(
      `/shipping/deliveries/${deliveryId}/progress`,
    );
  },
};
