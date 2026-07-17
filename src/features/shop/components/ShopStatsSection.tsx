import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Loader2, Package, Truck, Users, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getStoreStatisticsRequest } from "../api/shop.api";
import type { StoreStatistics } from "../types/shop";

/** Nhãn tiếng Việt cho trạng thái delivery. */
const STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Preparing: "Đang chuẩn bị",
  Shipped: "Đang giao",
  Delivered: "Đã giao",
  DeliveryFailed: "Giao thất bại",
  Cancelled: "Đã hủy",
  Returned: "Hoàn hàng",
};

const formatVnd = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v);

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

/**
 * Dashboard thống kê cửa hàng — CHỈ owner (BE trả 403 cho staff).
 * Doanh thu = tổng Subtotal của các delivery đã Delivered.
 */
export function ShopStatsSection({ storeId }: { storeId: string }) {
  const [stats, setStats] = useState<StoreStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getStoreStatisticsRequest(storeId)
      .then((res) => {
        if (!active) return;
        if (res.isSuccess && res.data) setStats(res.data);
        else toast.error(res.message || "Không tải được thống kê cửa hàng");
      })
      .catch(() => {
        if (active) toast.error("Không tải được thống kê cửa hàng");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={18} />
        Đang tải thống kê...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Không có dữ liệu thống kê cho cửa hàng này.
      </div>
    );
  }

  const series = buildMonthlySeries(stats);
  const deliveredCount = stats.deliveriesByStatus["Delivered"] ?? 0;

  const cards = [
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
      sub: "Đã nhận lời mời",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          Thống kê cửa hàng
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Doanh thu tính theo các đơn đã giao thành công (chưa trừ hoàn hàng).
        </p>
      </div>

      {/* Cards tổng quan */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Icon size={15} className="text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide">{c.label}</span>
              </div>
              <p className="mt-2 text-xl font-bold text-gray-900">{c.value}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{c.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart doanh thu 6 tháng */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Doanh thu 6 tháng gần nhất</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => (v >= 1_000_000 ? `${v / 1_000_000}tr` : String(v))}
                />
                <Tooltip
                  formatter={(value) => [formatVnd(Number(value)), "Doanh thu"]}
                  labelFormatter={(label) => `Tháng ${label}`}
                />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Đơn theo trạng thái */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Đơn giao theo trạng thái</h3>
          <ul className="space-y-2.5">
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = stats.deliveriesByStatus[key] ?? 0;
              if (count === 0 && !["Pending", "Shipped", "Delivered"].includes(key)) return null;
              const pct = stats.totalDeliveries > 0 ? (count / stats.totalDeliveries) * 100 : 0;
              return (
                <li key={key} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-600">{label}</span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
