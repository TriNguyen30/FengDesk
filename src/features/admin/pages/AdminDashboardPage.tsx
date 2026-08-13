import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, ShoppingBag, DollarSign, Package } from "lucide-react";
import { useAllOrdersList } from "@/features/orders";
import { formatVnd, formatOrderDate, STATUS_MAP } from "@/features/orders/utils/orderUtils";

export default function AdminDashboardPage() {
  const { orders, listStatus } = useAllOrdersList({ page: 1, pageSize: 1000 });

  const {
    totalRevenue,
    newOrdersCount,
    activeUsersCount,
    chartData,
    recentOrders,
    completedOrdersCount,
  } = useMemo(() => {
    let totalRev = 0;
    let newOrders = 0;
    let completedOrders = 0;
    const uniqueUsers = new Set<string>();
    const monthlyRevenue = Array(12).fill(0);

    const now = new Date();
    const currentYear = now.getFullYear();

    orders.forEach((o) => {
      uniqueUsers.add(o.customerId);

      if (o.status === "Pending") {
        newOrders++;
      }

      if (o.status === "Completed") {
        completedOrders++;
        totalRev += o.totalAmount || 0;

        const orderDate = new Date(o.createdAt);
        if (orderDate.getFullYear() === currentYear) {
          monthlyRevenue[orderDate.getMonth()] += o.totalAmount || 0;
        }
      }
    });

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const chart = months.map((name, index) => ({
      name,
      total: monthlyRevenue[index],
    }));

    return {
      totalRevenue: totalRev,
      newOrdersCount: newOrders,
      activeUsersCount: uniqueUsers.size,
      completedOrdersCount: completedOrders,
      chartData: chart,
      recentOrders: orders.slice(0, 5), // Assuming orders are returned newest first
    };
  }, [orders]);

  const stats = [
    {
      title: "Tổng Doanh Thu",
      value: formatVnd(totalRevenue),
      icon: DollarSign,
      trend: "Từ đầu năm",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Đơn Hàng Mới",
      value: newOrdersCount.toString(),
      icon: ShoppingBag,
      trend: "Đang chờ xử lý",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Khách Hàng",
      value: activeUsersCount.toString(),
      icon: Users,
      trend: "Đã đặt hàng",
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Đơn Hoàn Thành",
      value: completedOrdersCount.toString(),
      icon: Package,
      trend: "Đã giao thành công",
      color: "bg-orange-50 text-orange-600",
    },
  ];

  if (listStatus === "loading") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Tổng quan hiệu suất hoạt động kinh doanh toàn hệ thống.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}
              >
                <stat.icon size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Doanh Thu Năm Nay</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-gray-200)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-gray-500)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-gray-500)", fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value === 0) return "0";
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value.toString();
                  }}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-gray-100)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    background: "var(--fd-surface)",
                    color: "var(--color-gray-900)",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [formatVnd(value), "Doanh thu"]}
                />
                <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Đơn Hàng Gần Đây</h2>
          <div className="flex-1 flex flex-col overflow-y-auto max-h-[300px] pr-2">
            {recentOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <ShoppingBag size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">Chưa có đơn hàng nào.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const statusMeta = STATUS_MAP[order.status] || {
                    label: order.status,
                    className: "bg-gray-100 text-gray-700 border-gray-200",
                  };

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm text-gray-900 font-mono">
                          {order.orderCode ? `#${order.orderCode}` : `#${order.id.substring(0, 8)}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-gray-900">
                          {formatVnd(order.totalAmount || 0)}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
