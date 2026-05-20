import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { CartProduct, CartState } from "@/features/cart/types/cart";

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartProduct>) {
      const product = action.payload;
      const index = state.items.findIndex((l) => l.product.id === product.id);
      if (index === -1) {
        state.items.push({ product, quantity: 1 });
        return;
      }
      state.items[index].quantity += 1;
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter(
        (l) => l.product.id !== action.payload,
      );
    },
    setQuantity(
      state,
      action: PayloadAction<{ productId: number; quantity: number }>,
    ) {
      const { productId, quantity } = action.payload;
      if (quantity < 1) {
        state.items = state.items.filter((l) => l.product.id !== productId);
        return;
      }
      const line = state.items.find((l) => l.product.id === productId);
      if (line) line.quantity = quantity;
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, setQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

const selectCartItems = (state: RootState) => state.cart.items;

export const selectCartItemCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, line) => sum + line.quantity, 0),
);

export const selectCartSubtotal = createSelector(
  [selectCartItems],
  (items) =>
    items.reduce(
      (sum, line) => sum + line.product.price * line.quantity,
      0,
    ),
);

export { selectCartItems };
