import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import authReducer from "@/features/auth/store/authSlice";
import cartReducer from "@/features/cart/store/cartSlice";
import chatboxReducer from "@/features/chatbox/store/chatboxSlice";
import themeReducer from "./store/themeSlice";
import paymentReducer from "@/features/payment/store/paymentSlice";
import notificationReducer from "@/features/notification/store/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    chatbox: chatboxReducer,
    theme: themeReducer,
    payment: paymentReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
