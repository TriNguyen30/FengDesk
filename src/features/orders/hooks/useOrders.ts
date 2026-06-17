import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  cancelOrder,
  createOrder,
  fetchOrderById,
  fetchOrders,
  fetchStoreDeliveries,
  updateDeliveryStatus,
  clearCurrentOrder,
  resetCreateStatus,
  selectCreateOrderStatus,
  selectCurrentOrder,
  selectDeliveries,
  selectDeliveriesStatus,
  selectOrderDetailStatus,
  selectOrders,
  selectOrdersListStatus,
  selectOrdersPagination,
  selectUpdateDeliveryStatus,
} from "../store/orderSlice";
import type { CreateOrders, GetOrdersParams, UpdateDeliveryStatusParams } from "../types/orders";

export function useOrders() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrders);
  const listStatus = useAppSelector(selectOrdersListStatus);
  const pagination = useAppSelector(selectOrdersPagination);
  const currentOrder = useAppSelector(selectCurrentOrder);
  const detailStatus = useAppSelector(selectOrderDetailStatus);
  const createStatus = useAppSelector(selectCreateOrderStatus);
  const deliveries = useAppSelector(selectDeliveries);
  const deliveriesStatus = useAppSelector(selectDeliveriesStatus);
  const updateDeliveryStatusState = useAppSelector(selectUpdateDeliveryStatus);

  const getOrders = useCallback(
    (params?: GetOrdersParams) => dispatch(fetchOrders(params)),
    [dispatch],
  );

  const getOrderById = useCallback((id: string) => dispatch(fetchOrderById(id)), [dispatch]);

  const placeOrder = useCallback(
    (payload: CreateOrders) => dispatch(createOrder(payload)),
    [dispatch],
  );

  const cancelOrderById = useCallback((id: string) => dispatch(cancelOrder(id)), [dispatch]);

  const getStoreDeliveries = useCallback(
    (storeId: string, params?: GetOrdersParams) =>
      dispatch(fetchStoreDeliveries({ storeId, params })),
    [dispatch],
  );

  const changeDeliveryStatus = useCallback(
    (deliveryId: string, data: UpdateDeliveryStatusParams, storeId?: string) =>
      dispatch(updateDeliveryStatus({ deliveryId, data, storeId })),
    [dispatch],
  );

  const clearOrder = useCallback(() => dispatch(clearCurrentOrder()), [dispatch]);
  const resetCreate = useCallback(() => dispatch(resetCreateStatus()), [dispatch]);

  return {
    orders,
    listStatus,
    pagination,
    currentOrder,
    detailStatus,
    createStatus,
    deliveries,
    deliveriesStatus,
    updateDeliveryStatusState,
    getOrders,
    getOrderById,
    placeOrder,
    cancelOrderById,
    getStoreDeliveries,
    changeDeliveryStatus,
    clearOrder,
    resetCreate,
  };
}
