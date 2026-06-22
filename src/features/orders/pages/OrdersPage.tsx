import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2, Package } from "lucide-react";
import { useOrdersList } from "../hooks/useOrders";
import { formatOrderDate, formatVnd, getOrderStatusMeta } from "../utils/orderUtils";

export default function OrdersPage() {
  const { orders, listStatus, pagination } = useOrdersList({ page: 1, pageSize: 20 });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>

      {listStatus === "loading" ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Package className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-600">Bạn chưa có đơn hàng nào</p>
          <Link
            to="/products"
            className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusMeta = getOrderStatusMeta(order.status, order.paymentMethod);
            return (
              <Link
                key={order.id}
                to={`/profile/orders/${order.id}`}
                className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Đơn #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{formatOrderDate(order.createdAt)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm text-gray-600">{order.paymentMethod}</span>
                  <div className="flex items-center gap-1 text-sm font-bold text-primary">
                    {formatVnd(order.totalAmount)}
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}

          {pagination.totalPages > 1 && (
            <p className="pt-2 text-center text-xs text-gray-500">
              Trang {pagination.page}/{pagination.totalPages} · {pagination.totalCount} đơn hàng
            </p>
          )}
        </div>
      )}
    </div>
  );
}
