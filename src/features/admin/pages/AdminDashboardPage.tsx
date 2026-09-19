import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, ShoppingBag, DollarSign, Package, Store as StoreIcon, Truck, Building2, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useAllOrdersList } from "@/features/orders";
import { formatVnd, formatOrderDate, STATUS_MAP } from "@/features/orders/utils/orderUtils";
import { getAllShopRequest, getStoreStatisticsRequest } from "@/features/shop/api/shop.api";
import type { Shop, StoreStatistics } from "@/features/shop/types/shop";

interface ShopWithStats {
  shop: Shop;
  stats: StoreStatistics | null;
}

export default function AdminDashboardPage() {
  const { orders, listStatus } = useAllOrdersList({ page: 1, pageSize: 1000 });
  const [shopStatsList, setShopStatsList] = useState<ShopWithStats[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingShops(true);

    getAllShopRequest()
      .then(async (res) => {
        if (!active) return;
        if (res.isSuccess && res.data) {
          const shops = res.data;
          const statsPromises = shops.map((shop) =>
            getStoreStatisticsRequest(shop.id)
              .then((statRes) => ({
                shop,
                stats: statRes.isSuccess && statRes.data ? statRes.data : null,
              }))
              .catch(() => ({ shop, stats: null }))
          );
          const results = await Promise.all(statsPromises);
          if (active) {
            setShopStatsList(results);
          }
        }
      })
      .catch((err) => {
        console.error("Error loading shops for admin dashboard:", err);
      })
      .finally(() => {
        if (active) setLoadingShops(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const {
    totalOrderRevenue,
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

      // Nhận diện cả Completed và Delivered để khớp tính toán doanh thu toàn hệ thống
      if (["Completed", "Delivered"].includes(o.status)) {
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
      totalOrderRevenue: totalRev,
      newOrdersCount: newOrders,
      activeUsersCount: uniqueUsers.size,
      completedOrdersCount: completedOrders,
      chartData: chart,
      recentOrders: orders.slice(0, 5),
    };
  }, [orders]);

  // Aggregate total product revenue and shipping fees from all shops
  const { totalShopsRevenue, totalShopsShippingFee, totalShopsDeliveries } = useMemo(() => {
    let rev = 0;
    let shipping = 0;
    let deliveries = 0;

    shopStatsList.forEach(({ stats }) => {
      if (stats) {
        rev += stats.totalRevenue || 0;
        shipping += stats.totalShippingFee || 0;
        deliveries += stats.totalDeliveries || 0;
      }
    });

    return {
      totalShopsRevenue: rev,
      totalShopsShippingFee: shipping,
      totalShopsDeliveries: deliveries,
    };
  }, [shopStatsList]);

  const stats = [
    {
      title: "Doanh Thu Sản Phẩm (Tất cả cửa hàng)",
      value: formatVnd(totalShopsRevenue),
      icon: DollarSign,
      trend: `${shopStatsList.length} cửa hàng`,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Tổng Phí Vận Chuyển",
      value: formatVnd(totalShopsShippingFee),
      icon: Truck,
      trend: `${totalShopsDeliveries} đơn giao`,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Đơn Hàng Mới",
      value: newOrdersCount.toString(),
      icon: ShoppingBag,
      trend: "Đang chờ xử lý",
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Đơn Hoàn Thành / Đã Giao",
      value: completedOrdersCount.toString(),
      icon: Package,
      trend: `${activeUsersCount} khách hàng`,
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
        <p className="text-gray-500 mt-1">Tổng quan hiệu suất hoạt động kinh doanh toàn hệ thống và từng cửa hàng.</p>
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

      {/* Doanh thu theo Cửa hàng */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <StoreIcon size={20} className="text-primary" />
              Doanh Thu Theo Cửa Hàng ({shopStatsList.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Thống kê doanh thu sản phẩm và phí vận chuyển riêng cho từng cửa hàng trong hệ thống.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-500">Tổng doanh thu đơn hàng: </span>
            <span className="text-sm font-bold text-emerald-600">{formatVnd(totalOrderRevenue)}</span>
          </div>
        </div>

        {loadingShops ? (
          <div className="py-8 text-center text-sm text-gray-400">Đang tải thống kê cửa hàng...</div>
        ) : shopStatsList.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">Chưa có dữ liệu cửa hàng.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Cửa hàng</th>
                  <th className="pb-3 px-4">Hotline</th>
                  <th className="pb-3 px-4 text-center">Đơn thành công</th>
                  <th className="pb-3 px-4 text-right">Phí vận chuyển</th>
                  <th className="pb-3 px-4 text-right">Doanh thu sản phẩm</th>
                  <th className="pb-3 px-4 text-right">% Hệ thống</th>
                  <th className="pb-3 pl-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shopStatsList.map(({ shop, stats }) => {
                  const shopRev = stats?.totalRevenue ?? 0;
                  const shopShip = stats?.totalShippingFee ?? 0;
                  const deliveredCount = stats?.deliveriesByStatus["Delivered"] ?? 0;
                  const pct = totalShopsRevenue > 0 ? (shopRev / totalShopsRevenue) * 100 : 0;

                  return (
                    <tr key={shop.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{shop.name}</p>
                            <p className="text-[11px] text-gray-400 font-normal">
                              {typeof shop.address === "string" ? shop.address : "Cơ sở cửa hàng"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{shop.hotline || "N/A"}</td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-700">
                        {deliveredCount}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {formatVnd(shopShip)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatVnd(shopRev)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-semibold text-gray-600">{pct.toFixed(1)}%</span>
                          <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <Link
                          to={`/stores/${shop.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Chi tiết <ArrowUpRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

