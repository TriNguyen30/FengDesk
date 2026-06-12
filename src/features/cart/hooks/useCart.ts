import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartState,
  selectCart,
  selectCartItems,
  selectCartItemCount,
  selectCartSubtotal,
} from "@/features/cart/store/cartSlice";
import type { AddCartItemParams, UpdateCartItemParams } from "@/features/cart/types/cart";

export function useCart() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const items = useAppSelector(selectCartItems);
  const itemCount = useAppSelector(selectCartItemCount);
  const subtotal = useAppSelector(selectCartSubtotal);

  const getCart = useCallback(() => dispatch(fetchCart()), [dispatch]);

  const addItem = useCallback(
    (params: AddCartItemParams) => dispatch(addCartItem(params)),
    [dispatch],
  );

  const removeItem = useCallback(
    (itemId: string) => dispatch(removeCartItem(itemId)),
    [dispatch],
  );

  const setQuantity = useCallback(
    (params: UpdateCartItemParams) => dispatch(updateCartItem(params)),
    [dispatch],
  );

  const clearCart = useCallback(() => dispatch(clearCartState()), [dispatch]);

  return {
    cart,
    items,
    itemCount,
    subtotal,
    getCart,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
  };
}
