import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import { paymentApi } from "../api/paymentApi";
import type {
  CreatePaymentResponse,
  PaymentStatusResponse,
  CancelPaymentRequest,
} from "../types/payment";

type LoadingStatus = "idle" | "loading" | "failed";

interface PaymentState {
  currentPayment: CreatePaymentResponse | null;
  paymentStatus: PaymentStatusResponse | null;
  status: LoadingStatus;
  actionStatus: LoadingStatus;
  error: string | null;
}

const initialState: PaymentState = {
  currentPayment: null,
  paymentStatus: null,
  status: "idle",
  actionStatus: "idle",
  error: null,
};

export const createPayment = createAsyncThunk(
  "payment/createPayment",
  async (orderId: string) => {
    const response = await paymentApi.createPayment(orderId);
    return response.data;
  },
);

export const fetchPaymentStatus = createAsyncThunk(
  "payment/fetchPaymentStatus",
  async (orderId: string) => {
    const response = await paymentApi.getPaymentStatus(orderId);
    return response.data;
  },
);

export const cancelPayment = createAsyncThunk(
  "payment/cancelPayment",
  async ({ orderId, payload }: { orderId: string; payload?: CancelPaymentRequest }) => {
    const response = await paymentApi.cancelPayment(orderId, payload);
    return { orderId, data: response.data };
  },
);

export const simulatePaid = createAsyncThunk(
  "payment/simulatePaid",
  async (orderId: string) => {
    const response = await paymentApi.simulatePaid(orderId);
    return { orderId, data: response.data };
  },
);

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearPaymentState(state) {
      state.currentPayment = null;
      state.paymentStatus = null;
      state.status = "idle";
      state.actionStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Payment Link
      .addCase(createPayment.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.status = "idle";
        if (action.payload.isSuccess && action.payload.data) {
          state.currentPayment = action.payload.data;
        } else {
          state.error = action.payload.message || "Failed to create payment link";
        }
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to create payment link";
      })

      // Fetch Payment Status
      .addCase(fetchPaymentStatus.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPaymentStatus.fulfilled, (state, action) => {
        state.status = "idle";
        if (action.payload.isSuccess && action.payload.data) {
          state.paymentStatus = action.payload.data;
        } else {
          state.error = action.payload.message || "Failed to fetch payment status";
        }
      })
      .addCase(fetchPaymentStatus.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch payment status";
      })

      // Cancel Payment Link
      .addCase(cancelPayment.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(cancelPayment.fulfilled, (state, action) => {
        state.actionStatus = "idle";
        if (action.payload.data.isSuccess) {
          if (state.paymentStatus && state.paymentStatus.orderId === action.payload.orderId) {
            state.paymentStatus.paymentStatus = "Cancelled";
            state.paymentStatus.orderStatus = "Cancelled";
          }
        } else {
          state.error = action.payload.data.message || "Failed to cancel payment";
        }
      })
      .addCase(cancelPayment.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.error.message || "Failed to cancel payment";
      })

      // Simulate Paid
      .addCase(simulatePaid.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(simulatePaid.fulfilled, (state, action) => {
        state.actionStatus = "idle";
        if (action.payload.data.isSuccess) {
          if (state.paymentStatus && state.paymentStatus.orderId === action.payload.orderId) {
            state.paymentStatus.paymentStatus = "Paid";
            state.paymentStatus.orderStatus = "Paid";
          }
        } else {
          state.error = action.payload.data.message || "Failed to simulate payment success";
        }
      })
      .addCase(simulatePaid.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.error.message || "Failed to simulate payment success";
      });
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;

export const selectCurrentPayment = (state: RootState) => state.payment.currentPayment;
export const selectPaymentStatus = (state: RootState) => state.payment.paymentStatus;
export const selectPaymentLoadingStatus = (state: RootState) => state.payment.status;
export const selectPaymentActionStatus = (state: RootState) => state.payment.actionStatus;
export const selectPaymentError = (state: RootState) => state.payment.error;
