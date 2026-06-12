import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { CartProduct, AddCartItemParams, UpdateCartItemParams } from "@/features/cart/types/cart";
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
  async (params: AddCartItemParams) => {
    const response = await cartApi.addCartItem(params);
    return response.data;
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async (params: UpdateCartItemParams) => {
    const response = await cartApi.updateCartItem(params);
    return response.data;
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (itemId: string) => {
    const response = await cartApi.deleteCartItem({ itemId });
    return response.data;
  }
);

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
        state.cart = action.payload?.data || null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.cart = action.payload?.data || null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.cart = action.payload?.data || null;
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCart = (state: RootState) => state.cart.cart;
export const selectCartItems = (state: RootState) => state.cart.cart?.items || [];
export const selectCartItemCount = (state: RootState) =>
  state.cart.cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
export const selectCartSubtotal = (state: RootState) => state.cart.cart?.subtotal || 0;
