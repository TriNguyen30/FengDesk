import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shippingApi } from "../api/shipping.api";
import type { GetOrdersParams } from "@/features/orders/types/orders";
import type { UpdateDeliveryStatusParams } from "../types/shipping";

export function useStoreDeliveries(storeId: string, params?: GetOrdersParams) {
  const query = useQuery({
    queryKey: ["deliveries", storeId, params],
    queryFn: async () => {
      const response = await shippingApi.getStoreDeliveries(storeId, params);
      return response.data;
    },
    enabled: !!storeId,
  });

  const data = query.data;

  return {
    deliveries: data?.isSuccess && data.data ? data.data.items : [],
    pagination: {
      page: data?.isSuccess && data.data ? data.data.page : 1,
      pageSize: data?.isSuccess && data.data ? data.data.pageSize : 20,
      totalCount: data?.isSuccess && data.data ? data.data.totalCount : 0,
      totalPages: data?.isSuccess && data.data ? data.data.totalPages : 0,
    },
    deliveriesStatus: query.isLoading ? "loading" : query.isError ? "failed" : "idle",
    query,
  };
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliveryId, data }: { deliveryId: string; data: UpdateDeliveryStatusParams }) =>
      shippingApi.updateDeliveryStatus(deliveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });
}

export function useDeliveryProgress(deliveryId?: string) {
  const query = useQuery({
    queryKey: ["deliveryProgress", deliveryId],
    queryFn: async () => {
      if (!deliveryId) throw new Error("No delivery ID provided");
      const response = await shippingApi.getDeliveryProgress(deliveryId);
      return response.data;
    },
    enabled: !!deliveryId,
  });

  const data = query.data;

  return {
    progress: data?.isSuccess && data.data ? data.data : [],
    progressStatus: query.isLoading ? "loading" : query.isError ? "failed" : "idle",
    query,
  };
}
