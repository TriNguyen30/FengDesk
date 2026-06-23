import type { Delivery } from "@/features/users/types/shipping";

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
  deliveryId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface StatusLog {
  fromStatus: string | null;
  toStatus: string;
  note: string;
  changedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  totalShippingFee: number;
  totalAmount: number;
  deliveryCount?: number;
  createdAt: string;
}

export interface OrderDetail extends Order {
  shippingAddressId: string;
  note: string;
  items: OrderLineItem[];
  deliveries: Delivery[];
  statusLogs: StatusLog[];
}

export interface GetOrdersParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export type GetOrdersResponse = PaginatedResponse<Order>;
export type GetOrderDetailResponse = ApiResponse<OrderDetail>;
export type CreateOrderResponse = ApiResponse<OrderDetail>;

export interface UpdateDeliveryStatusRequest {
  status: string;
  trackingCode?: string | null;
  shippingProvider?: string | null;
  note?: string | null;
}
