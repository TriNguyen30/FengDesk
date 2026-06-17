import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/store/authSlice";
import cartReducer from "@/features/cart/store/cartSlice";
import productReducer from "@/features/products/store/productSlice";
import orderReducer from "@/features/orders/store/orderSlice";
import chatboxReducer from "@/features/chatbox/store/chatboxSlice";
import themeReducer from "@/store/slices/themeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    product: productReducer,
    order: orderReducer,
    chatbox: chatboxReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
