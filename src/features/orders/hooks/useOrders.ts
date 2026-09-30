import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/orders.api";
import type { CreateOrders, GetOrdersParams, OrdersItem } from "../types/orders";
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

/**
 * Xem trước tiền của đơn — CÙNG hàm BE dùng lúc đặt (gồm cả voucher), nên `totalAmount` ở đây là số khách sẽ
 * bị tính. FE không tự cộng trừ phí ship hay khoản giảm.
 *
 * `preview` là undefined khi chưa có dữ liệu hoặc gọi lỗi — nơi dùng phải chặn nút đặt hàng lúc đó, đừng coi
 * như phí 0đ (trước đây hook trả 0 khi lỗi ⇒ khách thấy thiếu phí ship rồi bị tính đủ).
 */
export function useShippingFeePreview(
  shippingAddressId: string | undefined,
  items: OrdersItem[],
  voucherCode?: string,
) {
  const query = useQuery({
    queryKey: ["shipping-fee-preview", shippingAddressId, items, voucherCode ?? ""],
    enabled: Boolean(shippingAddressId) && items.length > 0,
    queryFn: async () => {
      const res = await ordersApi.previewShippingFee({
        shippingAddressId: shippingAddressId!,
        items,
        voucherCode: voucherCode || undefined,
      });
      return res.data;
    },
  });

  const preview = query.data?.isSuccess ? query.data.data : undefined;

  return {
    preview,
    shippingFee: preview?.totalShippingFee ?? 0,
    shippingDiscount: preview?.shippingDiscount ?? 0,
    totalAmount: preview?.totalAmount,
    appliedVoucher: preview?.appliedVoucher ?? null,
    voucherMessage: preview?.voucherMessage ?? null,
    stores: preview?.stores ?? [],
    isLoading: query.isLoading || query.isFetching,
    isError: query.isError || (query.data != null && !query.data.isSuccess),
  };
}

/** Khách xác nhận đã nhận hàng — thay cho việc gọi endpoint dev trước đây (đã đóng ở production). */
export function useConfirmReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => (await ordersApi.confirmReceived(orderId)).data,
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
  });
}

/** Lỗi axios của BE (409 chưa có kiện đang giao…) mang message tiếng Việt trong phong bì — lấy ra để hiện. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || fallback;
}

/** Voucher đang áp dụng — hiện ưu đãi thay cho câu chữ viết cứng. Ít đổi nên cache lâu. */
export function useAvailableVouchers() {
  const query = useQuery({
    queryKey: ["available-vouchers"],
    queryFn: async () => {
      const res = await ordersApi.getAvailableVouchers();
      return res.data.isSuccess ? res.data.data : [];
    },
    staleTime: 10 * 60 * 1000,
  });
  return { vouchers: query.data ?? [] };
}

export function useUpdateOrderDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryId,
      data,
    }: {
      deliveryId: string;
      data: import("../types/orders").UpdateDeliveryStatusRequest;
    }) => ordersApi.updateDeliveryStatus(deliveryId, data),
    onSuccess: () => {
      // Invalidate relevant queries.
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      queryClient.invalidateQueries({ queryKey: ["store-deliveries"] });
      // To invalidate specific order detail, we could rely on the UI to refetch or pass orderId.
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useStoreDeliveries(storeId: string | undefined, params?: GetOrdersParams) {
  const query = useQuery({
    queryKey: ["store-deliveries", storeId, params],
    enabled: !!storeId,
    queryFn: async () => {
      const response = await ordersApi.getStoreDeliveries(storeId!, params);
      return response.data;
    },
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
    listStatus: query.isLoading ? "loading" : query.isError ? "failed" : "idle",
    query,
  };
}

export function useCreateDeliveryShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => ordersApi.createDeliveryShipment(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}
