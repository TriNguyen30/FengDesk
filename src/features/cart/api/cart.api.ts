import fetchHttpClient from "@/lib/httpClient";
import type {
    GetCartResponse,
    AddCartItemParams,
    AddCartItemResponse,
    UpdateCartItemParams,
    UpdateCartItemResponse,
    DeleteCartItemParams,
    DeleteCartItemResponse,
    DeleteCartResponse,
} from "../types/cart";

export const cartApi = {
    getCart: () => {
        return fetchHttpClient.get<GetCartResponse>("/cart");
    },

    addCartItem: (data: AddCartItemParams) => {
        return fetchHttpClient.post<AddCartItemResponse>("/cart/items", data);
    },

    updateCartItem: ({ itemId, quantity }: UpdateCartItemParams) => {
        return fetchHttpClient.put<UpdateCartItemResponse>(`/cart/items/${itemId}`, { quantity });
    },

    deleteCartItem: ({ itemId }: DeleteCartItemParams) => {
        return fetchHttpClient.delete<DeleteCartItemResponse>(`/cart/items/${itemId}`);
    },

    deleteCart: () => {
        return fetchHttpClient.delete<DeleteCartResponse>("/cart");
    },
};
