import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/orders.api";
import type { CreateOrders, GetOrdersParams } from "../types/orders";
import { useAppDispatch } from "@/app/store";
import { fetchCart } from "@/features/cart/store/cartSlice";

export function useOrdersList(params?: GetOrdersParams) {
  const query = useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const response = await ordersApi.getOrders(params);
      return response.data;
    },
  });

  const data = query.data;

  return {
    orders: data?.isSuccess && data.data ? data.data.items : [],
    pagination: {
      page: data?.isSuccess && data.data ? data.data.page : 1,
      pageSize: data?.isSuccess && data.data ? data.data.pageSize : 20,
      totalCount: data?.isSuccess && data.data ? data.data.totalCount : 0,
      totalPages: data?.isSuccess && data.data ? data.data.totalPages : 0,
    },
    listStatus: query.isLoading ? "loading" : query.isError ? "failed" : "idle",
    query,
  };
}

export function useAllOrdersList(params?: GetOrdersParams) {
  const query = useQuery({
    queryKey: ["all-orders", params],
    queryFn: async () => {
      const response = await ordersApi.getAllOrders(params);
      return response.data;
    },
  });

  const data = query.data;

  return {
    orders: data?.isSuccess && data.data ? data.data.items : [],
    pagination: {
      page: data?.isSuccess && data.data ? data.data.page : 1,
      pageSize: data?.isSuccess && data.data ? data.data.pageSize : 20,
      totalCount: data?.isSuccess && data.data ? data.data.totalCount : 0,
      totalPages: data?.isSuccess && data.data ? data.data.totalPages : 0,
    },
    listStatus: query.isLoading ? "loading" : query.isError ? "failed" : "idle",
    query,
  };
}

export function useOrderDetail(id?: string) {
  const query = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      const response = await ordersApi.getOrderById(id);
      return response.data;
    },
    enabled: !!id,
  });

  const data = query.data;

  return {
    currentOrder: data?.isSuccess ? data.data : null,
    detailStatus: query.isLoading ? "loading" : query.isError ? "failed" : "idle",
    query,
  };
}

export function useCreateOrder() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrders) => ordersApi.createOrder(payload),
    onSuccess: (res) => {
      if (res.data.isSuccess) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        dispatch(fetchCart());
      }
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.cancelOrder(id),
    onSuccess: (res, id) => {
      if (res.data.isSuccess) {
        queryClient.invalidateQueries({ queryKey: ["order", id] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    },
  });
}
