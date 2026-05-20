import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addItem as addItemAction,
  clearCart as clearCartAction,
  removeItem as removeItemAction,
  selectCartItemCount,
  selectCartItems,
  selectCartSubtotal,
  setQuantity as setQuantityAction,
} from "@/features/cart/store/cartSlice";
import type { CartProduct } from "@/features/cart/types/cart";

export function useCart() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const itemCount = useAppSelector(selectCartItemCount);
  const subtotal = useAppSelector(selectCartSubtotal);

  const addItem = useCallback(
    (product: CartProduct) => dispatch(addItemAction(product)),
    [dispatch],
  );

  const removeItem = useCallback(
    (productId: number) => dispatch(removeItemAction(productId)),
    [dispatch],
  );

  const setQuantity = useCallback(
    (productId: number, quantity: number) =>
      dispatch(setQuantityAction({ productId, quantity })),
    [dispatch],
  );

  const clearCart = useCallback(
    () => dispatch(clearCartAction()),
    [dispatch],
  );

  return {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
  };
}
