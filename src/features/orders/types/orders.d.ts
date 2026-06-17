export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: string[] | null;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export type PaymentMethod = "PayOS" | "COD";

export interface CreateOrders {
  shippingAddressId: string;
  note: string;
  items: OrdersItem[];
  paymentMethod: PaymentMethod;
}

export interface OrdersItem {
  productItemId: string;
  quantity: number;
}

export interface OrderLineItem {
  id: string;
  productItemId: string;
  productId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
}

export interface OrderShippingAddress {
  recipientName: string;
  recipientPhone: string;
  streetAddress: string;
  wardName?: string;
  districtName?: string;
  provinceName?: string;
}

export interface Order {
  id: string;
  orderCode?: string;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  note?: string;
  subtotal: number;
  shippingFee?: number;
  totalAmount: number;
  itemCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderDetail extends Order {
  items: OrderLineItem[];
  shippingAddress?: OrderShippingAddress;
  paymentUrl?: string;
}

export interface GetOrdersParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export type GetOrdersResponse = PaginatedResponse<Order>;
export type GetOrderDetailResponse = ApiResponse<OrderDetail>;
export type CreateOrderResponse = ApiResponse<OrderDetail>;

export interface Delivery {
  id: string;
  orderId: string;
  orderCode?: string;
  status: string;
  customerName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt?: string;
}

export type GetDeliveriesResponse = PaginatedResponse<Delivery>;

export interface UpdateDeliveryStatusParams {
  status: string;
}

export type UpdateDeliveryStatusResponse = ApiResponse<Delivery>;
