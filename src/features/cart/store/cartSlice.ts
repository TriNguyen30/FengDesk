import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import type {
  CartProduct,
  AddCartItemParams,
  UpdateCartItemParams,
} from "@/features/cart/types/cart";
import { cartApi } from "../api/cart.api";

interface CartState {
  cart: CartProduct | null;
  status: "idle" | "loading" | "failed";
}

const initialState: CartState = {
  cart: null,
  status: "idle",
};

export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const response = await cartApi.getCart();
  return response.data;
});

export const addCartItem = createAsyncThunk(
  "cart/addCartItem",
  async (params: AddCartItemParams, { dispatch }) => {
    const response = await cartApi.addCartItem(params);
    if (response.data.isSuccess) {
      dispatch(fetchCart());
    }
    return response.data;
  },
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async (params: UpdateCartItemParams, { dispatch }) => {
    const response = await cartApi.updateCartItem(params);
    if (response.data.isSuccess) {
      dispatch(fetchCart());
    }
    return response.data;
  },
);

export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (itemId: string, { dispatch }) => {
    const response = await cartApi.deleteCartItem({ itemId });
    if (response.data.isSuccess) {
      dispatch(fetchCart());
    }
    return response.data;
  },
);

export const deleteAllCart = createAsyncThunk("cart/deleteAllCart", async (_, { dispatch }) => {
  const response = await cartApi.deleteCart();
  if (response.data.isSuccess) {
    dispatch(fetchCart());
  }
  return response.data;
});

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartState(state) {
      state.cart = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "idle";
        state.cart = action.payload?.data || null;
      })
      .addCase(fetchCart.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(addCartItem.fulfilled, (state, action) => {
        if (action.payload?.data) state.cart = action.payload.data;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        if (action.payload?.data) state.cart = action.payload.data;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        if (action.payload?.data) state.cart = action.payload.data;
      })
      .addCase(deleteAllCart.fulfilled, (state) => {
        state.cart = null;
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;

/**
 * Nhánh "chưa có giỏ" phải trả về CÙNG một mảng rỗng.
 *
 * Viết `|| []` là tạo mảng MỚI ở mỗi lần gọi selector, nên useSyncExternalStore
 * luôn thấy tham chiếu khác và bắt component render lại sau MỌI action Redux —
 * kể cả action chẳng liên quan gì tới giỏ hàng. Navbar dùng useCart() và luôn
 * nằm trên màn hình, nên cái này chạm tới toàn app.
 */
const NO_CART_ITEMS: CartProduct["items"] = [];

export const selectCart = (state: RootState) => state.cart.cart;
export const selectCartStatus = (state: RootState) => state.cart.status;
export const selectCartItems = (state: RootState) => state.cart.cart?.items ?? NO_CART_ITEMS;
export const selectCartItemCount = (state: RootState) => state.cart.cart?.items.length ?? 0;
export const selectCartTotalQuantity = (state: RootState) => {
  const items = state.cart.cart?.items;
  if (!items) return 0;
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
};
export const selectCartSubtotal = (state: RootState) => state.cart.cart?.subtotal || 0;
