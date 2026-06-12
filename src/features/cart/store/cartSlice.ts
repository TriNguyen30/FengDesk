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
  async (params: AddCartItemParams, { dispatch }) => {
    const response = await cartApi.addCartItem(params);
    if (response.data.isSuccess) {
      dispatch(fetchCart());
    }
    return response.data;
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async (params: UpdateCartItemParams, { dispatch }) => {
    const response = await cartApi.updateCartItem(params);
    if (response.data.isSuccess) {
      dispatch(fetchCart());
    }
    return response.data;
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (itemId: string, { dispatch }) => {
    const response = await cartApi.deleteCartItem({ itemId });
    if (response.data.isSuccess) {
      dispatch(fetchCart());
    }
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
        if (action.payload?.data) state.cart = action.payload.data;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        if (action.payload?.data) state.cart = action.payload.data;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        if (action.payload?.data) state.cart = action.payload.data;
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
