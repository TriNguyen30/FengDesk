import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import authReducer from "@/features/auth/store/authSlice";
import cartReducer from "@/features/cart/store/cartSlice";
import productReducer from "@/features/products/store/productSlice";
import orderReducer from "@/features/orders/store/orderSlice";
import chatboxReducer from "@/features/chatbox/store/chatboxSlice";
import themeReducer from "./store/themeSlice";
import notificationReducer from "@/features/notification/store/notificationSlice";
import paymentReducer from "@/features/payment/store/paymentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    product: productReducer,
    order: orderReducer,
    chatbox: chatboxReducer,
    theme: themeReducer,
    notification: notificationReducer,
    payment: paymentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
