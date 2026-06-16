import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  deleteAllCart,
  clearCartState,
  selectCart,
  selectCartItems,
  selectCartItemCount,
  selectCartSubtotal,
} from "@/features/cart/store/cartSlice";
import { setAuthModal } from "@/features/auth/store/authSlice";
import type { AddCartItemParams, UpdateCartItemParams } from "@/features/cart/types/cart";
import { toast } from "sonner";

export function useCart() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const cart = useAppSelector(selectCart);
  const items = useAppSelector(selectCartItems);
  const itemCount = useAppSelector(selectCartItemCount);
  const subtotal = useAppSelector(selectCartSubtotal);

  const getCart = useCallback(() => dispatch(fetchCart()), [dispatch]);

  const addItem = useCallback(
    (params: AddCartItemParams) => {
      if (!user) {
        dispatch(setAuthModal("login"));
        toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng");
        return;
      }
      dispatch(addCartItem(params));
    },
    [dispatch, user],
  );

  const removeItem = useCallback((itemId: string) => dispatch(removeCartItem(itemId)), [dispatch]);

  const setQuantity = useCallback(
    (params: UpdateCartItemParams) => dispatch(updateCartItem(params)),
    [dispatch],
  );

  const clearCart = useCallback(() => dispatch(clearCartState()), [dispatch]);

  const deleteAll = useCallback(() => {
    if (!user) return;
    dispatch(deleteAllCart());
  }, [dispatch, user]);

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
    deleteAll,
  };
}
