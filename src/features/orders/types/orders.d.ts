export interface ApiResponse<T> {
    data: T;
    isSuccess: boolean;
    statusCode: number;
    message: string | null;
    errors: string[] | null;
}
export interface CreateOrders {
    shippingAddressId: string;
    note: string;
    items: OrdersItem[];
    paymentMethod: string;
}

export interface OrdersItem {
    productItemId: string;
    quantity: number;
}

