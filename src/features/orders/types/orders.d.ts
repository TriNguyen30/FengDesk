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
  /** Id sản phẩm gốc (Product) — dùng để đánh giá / mở trang sản phẩm, KHÔNG phải productItemId. */
  productId: string;
  deliveryId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/** Cửa hàng có hàng trong đơn. Tương ứng <c>OrderStoreResponse</c> BE. */
export interface OrderStore {
  storeId: string;
  storeName: string | null;
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
  /** Cửa hàng bán trong đơn — suy ra từ delivery, hoặc từ sản phẩm khi đơn chưa có delivery. */
  stores?: OrderStore[];
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

export interface PreviewShippingFeePayload {
  shippingAddressId: string;
  items: OrdersItem[];
}

export interface StoreShippingFee {
  storeId: string;
  storeName: string;
  subtotal: number;
  shippingFee: number;
}

export interface ShippingFeePreview {
  subtotal: number;
  totalShippingFee: number;
  totalAmount: number;
  stores: StoreShippingFee[];
}

/** Tương ứng <c>StoreDeliveryResponse</c> BE — màn garden owner liệt kê delivery của store. */
export interface StoreDelivery {
  id: string;
  orderId: string;
  status: string;
  shippingFee: number;
  subtotal: number;
  trackingCode: string | null;
  createdAt: string;
}

export type GetStoreDeliveriesResponse = PaginatedResponse<StoreDelivery>;

/** Tương ứng <c>DeliveryResponse</c> BE — payload trả về sau khi cập nhật/tạo ship. */
export interface DeliveryDetail {
  id: string;
  gardenStoreId: string;
  storeName: string | null;
  status: string;
  shippingFee: number;
  subtotal: number;
  trackingCode: string | null;
  shippingProvider: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDeliveryDate: string | null;
}

export type CreateShipmentResponse = ApiResponse<DeliveryDetail>;

/** Địa chỉ nhận — chỉ field vendor cần để đóng gói/in vận đơn. Tương ứng <c>DeliveryShippingAddressResponse</c> BE. */
export interface DeliveryShippingAddress {
  recipientName: string;
  recipientPhone: string;
  streetAddress: string;
  fullAddressText: string;
}

/**
 * Chi tiết một đơn giao — màn vendor (garden owner/staff) xem để đóng gói.
 * Tương ứng <c>DeliveryOrderDetailResponse</c> BE (GET /orders/deliveries/{id}/detail).
 * Chỉ chứa sản phẩm + thông tin thuộc đúng delivery này (không lộ hàng của store khác trong cùng order).
 */
export interface DeliveryOrderDetail {
  id: string;
  gardenStoreId: string;
  storeName: string | null;
  status: string;
  shippingFee: number;
  subtotal: number;
  trackingCode: string | null;
  shippingProvider: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDeliveryDate: string | null;

  orderId: string;
  orderCreatedAt: string;
  paymentMethod: string;
  orderStatus: string;
  orderNote: string | null;

  items: OrderLineItem[];
  shippingAddress: DeliveryShippingAddress;
}

export type GetDeliveryOrderDetailResponse = ApiResponse<DeliveryOrderDetail>;
