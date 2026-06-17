import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { fetchCart } from "@/features/cart/store/cartSlice";
import { ordersApi } from "../api/orders.api";
import type {
  CreateOrders,
  Delivery,
  GetOrdersParams,
  Order,
  OrderDetail,
  UpdateDeliveryStatusParams,
} from "../types/orders";

type LoadingStatus = "idle" | "loading" | "failed";

interface OrderState {
  orders: Order[];
  ordersPage: number;
  ordersPageSize: number;
  ordersTotalCount: number;
  ordersTotalPages: number;
  listStatus: LoadingStatus;

  currentOrder: OrderDetail | null;
  detailStatus: LoadingStatus;

  createStatus: LoadingStatus;

  deliveries: Delivery[];
  deliveriesPage: number;
  deliveriesTotalCount: number;
  deliveriesStatus: LoadingStatus;

  updateDeliveryStatus: LoadingStatus;
}

const initialState: OrderState = {
  orders: [],
  ordersPage: 1,
  ordersPageSize: 20,
  ordersTotalCount: 0,
  ordersTotalPages: 0,
  listStatus: "idle",

  currentOrder: null,
  detailStatus: "idle",

  createStatus: "idle",

  deliveries: [],
  deliveriesPage: 1,
  deliveriesTotalCount: 0,
  deliveriesStatus: "idle",

  updateDeliveryStatus: "idle",
};

export const fetchOrders = createAsyncThunk(
  "order/fetchOrders",
  async (params: GetOrdersParams = {}) => {
    const response = await ordersApi.getOrders(params);
    return { params, data: response.data };
  },
);

export const fetchOrderById = createAsyncThunk(
  "order/fetchOrderById",
  async (id: string) => {
    const response = await ordersApi.getOrderById(id);
    return response.data;
  },
);

export const createOrder = createAsyncThunk(
  "order/createOrder",
  async (payload: CreateOrders, { dispatch }) => {
    const response = await ordersApi.createOrder(payload);
    if (response.data.isSuccess) {
      dispatch(fetchCart());
    }
    return response.data;
  },
);

export const cancelOrder = createAsyncThunk(
  "order/cancelOrder",
  async (id: string, { dispatch }) => {
    const response = await ordersApi.cancelOrder(id);
    if (response.data.isSuccess) {
      dispatch(fetchOrderById(id));
      dispatch(fetchOrders());
    }
    return { id, data: response.data };
  },
);

export const fetchStoreDeliveries = createAsyncThunk(
  "order/fetchStoreDeliveries",
  async ({ storeId, params }: { storeId: string; params?: GetOrdersParams }) => {
    const response = await ordersApi.getStoreDeliveries(storeId, params);
    return { params, data: response.data };
  },
);

export const updateDeliveryStatus = createAsyncThunk(
  "order/updateDeliveryStatus",
  async ({
    deliveryId,
    data,
    storeId,
  }: {
    deliveryId: string;
    data: UpdateDeliveryStatusParams;
    storeId?: string;
  }) => {
    const response = await ordersApi.updateDeliveryStatus(deliveryId, data);
    return { deliveryId, storeId, data: response.data };
  },
);

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearCurrentOrder(state) {
      state.currentOrder = null;
      state.detailStatus = "idle";
    },
    resetCreateStatus(state) {
      state.createStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.listStatus = "loading";
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.listStatus = "idle";
        if (action.payload.data.isSuccess) {
          const paginated = action.payload.data.data;
          state.orders = paginated.items;
          state.ordersPage = paginated.page;
          state.ordersPageSize = paginated.pageSize;
          state.ordersTotalCount = paginated.totalCount;
          state.ordersTotalPages = paginated.totalPages;
        }
      })
      .addCase(fetchOrders.rejected, (state) => {
        state.listStatus = "failed";
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.detailStatus = "loading";
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.detailStatus = "idle";
        if (action.payload.isSuccess && action.payload.data) {
          state.currentOrder = action.payload.data;
        }
      })
      .addCase(fetchOrderById.rejected, (state) => {
        state.detailStatus = "failed";
      })
      .addCase(createOrder.pending, (state) => {
        state.createStatus = "loading";
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.createStatus = action.payload.isSuccess ? "idle" : "failed";
        if (action.payload.isSuccess && action.payload.data) {
          state.currentOrder = action.payload.data;
        }
      })
      .addCase(createOrder.rejected, (state) => {
        state.createStatus = "failed";
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        if (action.payload.data.isSuccess && action.payload.data.data) {
          state.currentOrder = action.payload.data.data;
          state.orders = state.orders.map((order) =>
            order.id === action.payload.id ? { ...order, status: "Cancelled" } : order,
          );
        }
      })
      .addCase(fetchStoreDeliveries.pending, (state) => {
        state.deliveriesStatus = "loading";
      })
      .addCase(fetchStoreDeliveries.fulfilled, (state, action) => {
        state.deliveriesStatus = "idle";
        if (action.payload.data.isSuccess) {
          const paginated = action.payload.data.data;
          state.deliveries = paginated.items;
          state.deliveriesPage = paginated.page;
          state.deliveriesTotalCount = paginated.totalCount;
        }
      })
      .addCase(fetchStoreDeliveries.rejected, (state) => {
        state.deliveriesStatus = "failed";
      })
      .addCase(updateDeliveryStatus.pending, (state) => {
        state.updateDeliveryStatus = "loading";
      })
      .addCase(updateDeliveryStatus.fulfilled, (state, action) => {
        state.updateDeliveryStatus = "idle";
        if (action.payload.data.isSuccess && action.payload.data.data) {
          const updated = action.payload.data.data;
          state.deliveries = state.deliveries.map((delivery) =>
            delivery.id === updated.id ? updated : delivery,
          );
        }
      })
      .addCase(updateDeliveryStatus.rejected, (state) => {
        state.updateDeliveryStatus = "failed";
      });
  },
});

export const { clearCurrentOrder, resetCreateStatus } = orderSlice.actions;
export default orderSlice.reducer;

export const selectOrders = (state: RootState) => state.order.orders;
export const selectOrdersListStatus = (state: RootState) => state.order.listStatus;
export const selectOrdersPagination = (state: RootState) => ({
  page: state.order.ordersPage,
  pageSize: state.order.ordersPageSize,
  totalCount: state.order.ordersTotalCount,
  totalPages: state.order.ordersTotalPages,
});
export const selectCurrentOrder = (state: RootState) => state.order.currentOrder;
export const selectOrderDetailStatus = (state: RootState) => state.order.detailStatus;
export const selectCreateOrderStatus = (state: RootState) => state.order.createStatus;
export const selectDeliveries = (state: RootState) => state.order.deliveries;
export const selectDeliveriesStatus = (state: RootState) => state.order.deliveriesStatus;
export const selectUpdateDeliveryStatus = (state: RootState) => state.order.updateDeliveryStatus;
