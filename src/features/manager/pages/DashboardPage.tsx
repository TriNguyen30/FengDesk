import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  BarChart3,
  Loader2,
  Package,
  Truck,
  Users,
  Wallet,
  Store as StoreIcon,
  ArrowRight,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppSelector } from "@/app/store";
import { getAllShopRequest, getMyShopsRequest, getStoreStatisticsRequest } from "@/features/shop/api/shop.api";
import type { Shop, StoreStatistics } from "@/features/shop/types/shop";
import { useStoreDeliveries, useAllOrdersList } from "@/features/orders";
import { formatOrderDate } from "@/features/orders/utils/orderUtils";

/** Nhãn tiếng Việt cho trạng thái delivery. */
const STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Preparing: "Đang chuẩn bị",
  Shipped: "Đang giao",
  Delivered: "Đã giao",
  Completed: "Đã hoàn thành",
  DeliveryFailed: "Giao thất bại",
  Cancelled: "Đã hủy",
  Returned: "Hoàn hàng",
};

const DELIVERY_STATUS_MAP: Record<string, { label: string; className: string }> = {
  Pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 border-amber-200" },
  Confirmed: { label: "Đã xác nhận", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  Preparing: { label: "Đang chuẩn bị", className: "bg-blue-50 text-blue-700 border-blue-200" },
  Shipped: { label: "Đang giao", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  Delivered: { label: "Đã giao", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Completed: { label: "Đã hoàn thành", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DeliveryFailed: { label: "Giao thất bại", className: "bg-rose-50 text-rose-700 border-rose-200" },
  Returned: { label: "Đã hoàn trả", className: "bg-gray-100 text-gray-600 border-gray-200" },
  Cancelled: { label: "Đã hủy", className: "bg-red-50 text-red-700 border-red-200" },
};

const formatVnd = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);

/** Đủ 6 tháng gần nhất (kể cả tháng 0 doanh thu) để chart không bị hụt cột. */
function buildMonthlySeries(stats: StoreStatistics) {
  const map = new Map(stats.revenueByMonth.map((p) => [`${p.year}-${p.month}`, p]));
  const out: { label: string; revenue: number; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const p = map.get(key);
    out.push({
      label: `T${d.getMonth() + 1}/${d.getFullYear() % 100}`,
      revenue: p?.revenue ?? 0,
      count: p?.deliveredCount ?? 0,
    });
  }
  return out;
}

function aggregateStoreStats(statsList: StoreStatistics[]): StoreStatistics {
  let totalRevenue = 0;
  let totalShippingFee = 0;
  let totalDeliveries = 0;
  let productCount = 0;
  let staffCount = 0;
  const deliveriesByStatus: Record<string, number> = {};
  const monthMap = new Map<string, { year: number; month: number; revenue: number; deliveredCount: number }>();

  statsList.forEach((s) => {
    totalRevenue += s.totalRevenue || 0;
    totalShippingFee += s.totalShippingFee || 0;
    totalDeliveries += s.totalDeliveries || 0;
    productCount += s.productCount || 0;
    staffCount += s.staffCount || 0;

    Object.entries(s.deliveriesByStatus || {}).forEach(([k, v]) => {
      deliveriesByStatus[k] = (deliveriesByStatus[k] || 0) + v;
    });

    (s.revenueByMonth || []).forEach((p) => {
      const key = `${p.year}-${p.month}`;
      const existing = monthMap.get(key) || { year: p.year, month: p.month, revenue: 0, deliveredCount: 0 };
      existing.revenue += p.revenue || 0;
      existing.deliveredCount += p.deliveredCount || 0;
      monthMap.set(key, existing);
    });
  });

  return {
    totalRevenue,
    totalShippingFee,
    totalDeliveries,
    productCount,
    staffCount,
    deliveriesByStatus,
    revenueByMonth: Array.from(monthMap.values()),
  };
}

export default function DashboardPage() {
  const currentUser = useAppSelector((s) => s.auth.user);
  const userRoles = useMemo(() => (currentUser?.role ?? "").split(",").map((r) => r.trim()), [currentUser?.role]);
  const isAdmin = useMemo(
    () => userRoles.some((r) => ["Admin", "SystemAdmin"].includes(r)),
    [userRoles]
  );

  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  const [stats, setStats] = useState<StoreStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch stores
  useEffect(() => {
    let active = true;
    setLoadingShops(true);

    const loadShops = async () => {
      try {
        const [allRes, mineRes] = await Promise.allSettled([
          getAllShopRequest(),
          getMyShopsRequest(),
        ]);

        let allStores: Shop[] = [];
        if (allRes.status === "fulfilled" && allRes.value?.isSuccess && allRes.value.data) {
          allStores = allRes.value.data;
        }

        const ownedIds = new Set<string>();
        const staffIds = new Set<string>();

        if (mineRes.status === "fulfilled" && mineRes.value?.isSuccess && mineRes.value.data) {
          mineRes.value.data.forEach((s) => {
            if (s.isOwner !== false) ownedIds.add(s.id);
            else staffIds.add(s.id);
          });
        }

        let enrichedStores = allStores.map((s) => ({
          ...s,
          isOwner: s.isOwner || ownedIds.has(s.id) || (!!currentUser?.id && s.ownerUserId === currentUser.id),
          isStaff: staffIds.has(s.id),
        }));

        if (enrichedStores.length === 0 && mineRes.status === "fulfilled" && mineRes.value?.data) {
          enrichedStores = mineRes.value.data.map((s) => ({
            ...s,
            isOwner: s.isOwner !== false,
            isStaff: s.isOwner === false,
          }));
        }

        const allowed = isAdmin
          ? enrichedStores
          : enrichedStores.filter(
              (s) =>
                s.isOwner ||
                (s as any).isStaff ||
                (!!currentUser?.id && s.ownerUserId === currentUser.id)
            );

        if (active) {
          setShops(allowed);
          if (allowed.length > 0) {
            setSelectedStoreId(allowed[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading shops:", err);
      } finally {
        if (active) setLoadingShops(false);
      }
    };

    loadShops();
    return () => {
      active = false;
    };
  }, [isAdmin, currentUser?.id]);

  // Fetch statistics when selectedStoreId or shops change
  useEffect(() => {
    let active = true;
    setLoadingStats(true);

    const fetchStats = async () => {
      if (!selectedStoreId) {
        if (isAdmin && shops.length > 0) {
          // Fetch all shops stats and aggregate
          const promises = shops.map((s) =>
            getStoreStatisticsRequest(s.id)
              .then((res) => (res.isSuccess && res.data ? res.data : null))
              .catch(() => null)
          );
          const results = await Promise.all(promises);
          const validStats = results.filter((s): s is StoreStatistics => s !== null);
          if (active) {
            setStats(aggregateStoreStats(validStats));
            setLoadingStats(false);
          }
        } else {
          if (active) {
            setStats(null);
            setLoadingStats(false);
          }
        }
        return;
      }

      try {
        const res = await getStoreStatisticsRequest(selectedStoreId);
        if (!active) return;
        if (res.isSuccess && res.data) {
          setStats(res.data);
        } else {
          toast.error(res.message || "Không tải được thống kê cửa hàng");
        }
      } catch (err) {
        if (active) toast.error("Không tải được thống kê cửa hàng");
      } finally {
        if (active) setLoadingStats(false);
      }
    };

    fetchStats();
    return () => {
      active = false;
    };
  }, [selectedStoreId, isAdmin, shops]);

  // Fetch recent deliveries for selected store
  const { deliveries: recentDeliveries, listStatus: deliveriesStatus } = useStoreDeliveries(
    selectedStoreId || undefined,
    { page: 1, pageSize: 5 }
  );

  // Fallback for all orders if all stores selected
  const { orders: allOrders } = useAllOrdersList(
    selectedStoreId ? undefined : { page: 1, pageSize: 5 }
  );

  const series = useMemo(() => (stats ? buildMonthlySeries(stats) : []), [stats]);

  const deliveredCount = useMemo(() => {
    if (!stats) return 0;
    return (stats.deliveriesByStatus["Delivered"] ?? 0) + (stats.deliveriesByStatus["Completed"] ?? 0);
  }, [stats]);

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        icon: Wallet,
        label: "Doanh thu (đã giao)",
        value: formatVnd(stats.totalRevenue),
        sub: `${deliveredCount} đơn giao thành công`,
      },
      {
        icon: Truck,
        label: "Tổng đơn giao",
        value: String(stats.totalDeliveries),
        sub: `Phí ship đã thu: ${formatVnd(stats.totalShippingFee)}`,
      },
      {
        icon: Package,
        label: "Sản phẩm",
        value: String(stats.productCount),
        sub: "Đang bán trên cửa hàng",
      },
      {
        icon: Users,
        label: "Nhân viên",
        value: String(stats.staffCount),
        sub: "Đã phân công / nhận việc",
      },
    ];
  }, [stats, deliveredCount]);

  if (loadingShops) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-400">
        <Loader2 className="animate-spin mr-2" size={20} />
        Đang tải thông tin cửa hàng...
      </div>
    );
  }

  if (shops.length === 0 && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100">
          <StoreIcon size={30} strokeWidth={1.5} />
        </div>
        <p className="text-base font-semibold text-gray-900">Không tìm thấy cửa hàng</p>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Tài khoản của bạn chưa được phân công hoặc chưa sở hữu cửa hàng nào trong hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Store Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            Dashboard Thống Kê
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng quan hiệu suất hoạt động kinh doanh và doanh thu cửa hàng.
          </p>
        </div>

        {/* Store selector */}
        {shops.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cửa hàng:</span>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              {isAdmin && <option value="">Tất cả cửa hàng ({shops.length})</option>}
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content */}
      {loadingStats ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 className="animate-spin text-primary" size={24} />
          <p className="text-sm font-medium">Đang tải thống kê dữ liệu...</p>
        </div>
      ) : !stats ? (
        <div className="py-16 text-center text-sm text-gray-500 rounded-2xl border border-gray-100 bg-white shadow-sm">
          Không có dữ liệu thống kê cho cửa hàng này.
        </div>
      ) : (
        <>
          {/* Top Overview Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Icon size={18} className="text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wide">{c.label}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-gray-900 tracking-tight">{c.value}</p>
                  <p className="mt-1 text-xs text-gray-400 font-medium">{c.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Revenue Chart & Status Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 6-Month Revenue BarChart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Doanh thu 6 tháng gần nhất</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Thống kê doanh thu theo các đơn giao thành công.</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v))}
                    />
                    <Tooltip
                      formatter={(value) => [formatVnd(Number(value)), "Doanh thu"]}
                      labelFormatter={(label) => `Tháng ${label}`}
                      contentStyle={{
                        borderRadius: "12px",
                        background: "#ffffff",
                        border: "1px solid #f3f4f6",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="var(--color-primary, #16a34a)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Delivery Status Breakdown */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-gray-900 mb-4">Đơn giao theo trạng thái</h3>
              <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
                {Object.entries(STATUS_LABELS).map(([key, label]) => {
                  const count = stats.deliveriesByStatus[key] ?? 0;
                  if (count === 0 && !["Pending", "Shipped", "Delivered", "Completed"].includes(key)) return null;
                  const pct = stats.totalDeliveries > 0 ? (count / stats.totalDeliveries) * 100 : 0;
                  return (
                    <li key={key} className="text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-gray-700">{label}</span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Recent Deliveries List */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Đơn hàng / Đơn giao gần đây</h3>
                <p className="text-xs text-gray-500 mt-0.5">Danh sách các đơn vận chuyển mới nhất thuộc cửa hàng.</p>
              </div>
              <Link
                to="/manager/orders"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Quản lý đơn hàng <ArrowRight size={14} />
              </Link>
            </div>

            {selectedStoreId ? (
              deliveriesStatus === "loading" ? (
                <div className="py-8 text-center text-xs text-gray-400">Đang tải danh sách đơn giao...</div>
              ) : recentDeliveries.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">Chưa có đơn vận chuyển nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 pr-4">Mã đơn giao</th>
                        <th className="pb-3 px-4">Người nhận</th>
                        <th className="pb-3 px-4">Ngày tạo</th>
                        <th className="pb-3 px-4 text-right">Tổng tiền</th>
                        <th className="pb-3 px-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {recentDeliveries.map((del) => {
                        const statusMeta = DELIVERY_STATUS_MAP[del.status] || {
                          label: del.status,
                          className: "bg-gray-100 text-gray-700 border-gray-200",
                        };
                        return (
                          <tr key={del.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3 pr-4 font-mono font-bold text-gray-900">
                              #{del.id.substring(0, 8)}
                            </td>
                            <td className="py-3 px-4 text-gray-700 font-medium">
                              {del.recipientName || "Khách hàng"}
                            </td>
                            <td className="py-3 px-4 text-gray-500">
                              {formatOrderDate(del.createdAt)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-gray-900">
                              {formatVnd(del.subtotal || 0)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 font-semibold rounded-md border text-[11px] ${statusMeta.className}`}
                              >
                                {statusMeta.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Mã đơn</th>
                      <th className="pb-3 px-4">Ngày tạo</th>
                      <th className="pb-3 px-4 text-right">Tổng tiền</th>
                      <th className="pb-3 px-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {allOrders.slice(0, 5).map((o) => {
                      const statusMeta = DELIVERY_STATUS_MAP[o.status] || {
                        label: o.status,
                        className: "bg-gray-100 text-gray-700 border-gray-200",
                      };
                      return (
                        <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 pr-4 font-mono font-bold text-gray-900">
                            {o.orderCode ? `#${o.orderCode}` : `#${o.id.substring(0, 8)}`}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {formatOrderDate(o.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            {formatVnd(o.totalAmount || 0)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 font-semibold rounded-md border text-[11px] ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
