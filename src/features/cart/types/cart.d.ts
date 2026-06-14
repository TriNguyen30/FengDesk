export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: string[] | null;
}
export interface CartProduct {
  id: string;
  customerId: string;
  items: CartItem[];
  subtotal: number;
}

export interface CartItem {
  id: string;
  productItemId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
}

export type GetCartResponse = ApiResponse<CartProduct>;

export interface AddCartItemParams {
  productItemId: string;
  quantity: number;
} 

export type AddCartItemResponse = ApiResponse<CartProduct>;

export interface UpdateCartItemParams {
  itemId: string;
  quantity: number;
}

export type UpdateCartItemResponse = ApiResponse<CartProduct>;

export interface DeleteCartItemParams {
  itemId: string;
}

export type DeleteCartItemResponse = ApiResponse<CartProduct>;

export type DeleteCartResponse = ApiResponse<void>;