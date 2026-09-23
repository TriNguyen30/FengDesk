import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Banknote, Loader2, PackageOpen, Truck, Users, Wallet } from "lucide-react";
import { getStoreStatisticsRequest } from "../api/shop.api";
import type { StoreStatistics } from "../types/shop";
import { StatsPendingItems, StatsRangeTabs } from "./StatsPendingItems";
import RevenueStateChart from "./RevenueStateChart";
import { EMPTY_CHART_ROW, toChartRow, type RevenueChartRow } from "./revenueChartRow";
import type { StatsRange } from "./statsRanges";

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

const formatVnd = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);

/** Dự phòng cho BE cũ (chưa có `revenueSeries`): 6 tháng gần nhất, chỉ có lớp "đã hoàn thành". */
function buildMonthlySeries(stats: StoreStatistics): RevenueChartRow[] {
  const map = new Map(stats.revenueByMonth.map((p) => [`${p.year}-${p.month}`, p]));
  const out: RevenueChartRow[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const p = map.get(`${d.getFullYear()}-${d.getMonth() + 1}`);
    out.push({
      ...EMPTY_CHART_ROW,
      label: `T${d.getMonth() + 1}/${d.getFullYear() % 100}`,
      completed: p?.revenue ?? 0,
      completedCount: p?.deliveredCount ?? 0,
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
  const [range, setRange] = useState<StatsRange>("month");

  useEffect(() => {
    let active = true;
    // Đổi mốc thì GIỮ dữ liệu cũ trên màn (chỉ mờ đi) — thay bằng skeleton là cả khối nháy một phát và
    // biểu đồ phải vẽ lại từ đầu, mất luôn hiệu ứng cột chạy sang hình mới.
    setLoading(true);
    getStoreStatisticsRequest(storeId, range)
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
  }, [storeId, range]);

  if (loading && !stats) {
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

  // BE trả sẵn chuỗi theo `range` (kể cả mốc rỗng); chỉ khi thiếu mới rơi về 6 tháng dựng ở client.
  const usingFallback = !stats.revenueSeries?.length;
  const series = usingFallback ? buildMonthlySeries(stats) : stats.revenueSeries!.map(toChartRow);
  const deliveredCount =
    (stats.deliveriesByStatus["Delivered"] ?? 0) + (stats.deliveriesByStatus["Completed"] ?? 0);

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
    // Hai thẻ "chưa hoàn thành": store cần biết còn bao nhiêu việc và bao nhiêu tiền đang treo.
    {
      icon: PackageOpen,
      label: "Đang xử lý",
      value: String(stats.activeDeliveries ?? 0),
      sub: `Chờ giao: ${formatVnd(stats.activeDeliveriesValue ?? 0)}`,
    },
    // Thẻ "Có thể rút" tạm ẩn (24/09/2026): con số đối soát đang SAI về nghiệp vụ — đơn đã cộng
    // vào số dư vẫn tiếp tục nằm trong "có thể rút", và công nợ hoàn hàng chưa bị trừ. Chỉ hiện
    // doanh thu cho tới khi luồng chi tiền được làm đúng (docs/adr/vendor-payout.md).
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
            <div
              key={c.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
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

      <StatsPendingItems rows={stats.itemsByStatus ?? []} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart doanh thu */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-gray-900">Doanh thu theo thời gian</h3>
            <StatsRangeTabs value={range} onChange={setRange} />
          </div>
          <div
            className={`transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}
          >
            <RevenueStateChart data={series} height={256} fallback={usingFallback} />
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
