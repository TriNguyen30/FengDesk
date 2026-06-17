import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import {
  createPayment as createPaymentAction,
  fetchPaymentStatus as fetchPaymentStatusAction,
  cancelPayment as cancelPaymentAction,
  simulatePaid as simulatePaidAction,
  clearPaymentState as clearPaymentStateAction,
  selectCurrentPayment,
  selectPaymentStatus,
  selectPaymentLoadingStatus,
  selectPaymentActionStatus,
  selectPaymentError,
} from "../store/paymentSlice";
import type { CancelPaymentRequest } from "../types/payment";

export function usePayment() {
  const dispatch = useAppDispatch();

  const currentPayment = useAppSelector(selectCurrentPayment);
  const paymentStatus = useAppSelector(selectPaymentStatus);
  const status = useAppSelector(selectPaymentLoadingStatus);
  const actionStatus = useAppSelector(selectPaymentActionStatus);
  const error = useAppSelector(selectPaymentError);

  const createPayment = useCallback(
    (orderId: string) => {
      return dispatch(createPaymentAction(orderId));
    },
    [dispatch],
  );

  const getPaymentStatus = useCallback(
    (orderId: string) => {
      return dispatch(fetchPaymentStatusAction(orderId));
    },
    [dispatch],
  );

  const cancelPayment = useCallback(
    (orderId: string, payload?: CancelPaymentRequest) => {
      return dispatch(cancelPaymentAction({ orderId, payload }));
    },
    [dispatch],
  );

  const simulatePaid = useCallback(
    (orderId: string) => {
      return dispatch(simulatePaidAction(orderId));
    },
    [dispatch],
  );

  const resetPaymentState = useCallback(() => {
    return dispatch(clearPaymentStateAction());
  }, [dispatch]);

  return {
    currentPayment,
    paymentStatus,
    status,
    actionStatus,
    error,
    createPayment,
    getPaymentStatus,
    cancelPayment,
    simulatePaid,
    resetPaymentState,
  };
}
export default usePayment;
