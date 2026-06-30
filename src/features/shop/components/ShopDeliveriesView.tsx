import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Search,
  Truck,
  X,
} from "lucide-react";
import {
  useCreateDeliveryShipment,
  useStoreDeliveries,
  useUpdateOrderDeliveryStatus,
} from "@/features/orders";
import type { StoreDelivery } from "@/features/orders";
import { formatOrderDate, formatVnd } from "@/features/orders/utils/orderUtils";

const DELIVERY_STATUS_MAP: Record<string, { label: string; className: string }> = {
  Pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 border-amber-200" },
  Confirmed: { label: "Đã xác nhận", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  Preparing: { label: "Đang chuẩn bị", className: "bg-blue-50 text-blue-700 border-blue-200" },
  Shipped: { label: "Đang giao", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  Delivered: { label: "Đã giao", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DeliveryFailed: { label: "Giao thất bại", className: "bg-rose-50 text-rose-700 border-rose-200" },
  Returned: { label: "Đã hoàn trả", className: "bg-gray-100 text-gray-600 border-gray-200" },
  Cancelled: { label: "Đã hủy", className: "bg-red-50 text-red-700 border-red-200" },
};

const TABS: { value: string; label: string }[] = [
  { value: "All", label: "Tất cả" },
  { value: "Pending", label: "Chờ xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Preparing", label: "Đang chuẩn bị" },
  { value: "Shipped", label: "Đang giao" },
  { value: "Delivered", label: "Đã giao" },
  { value: "Cancelled", label: "Đã hủy" },
];

const PAGE_SIZE = 20;

interface ShopDeliveriesViewProps {
  storeId: string;
}

export function ShopDeliveriesView({ storeId }: ShopDeliveriesViewProps) {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);

  const { deliveries, pagination, listStatus } = useStoreDeliveries(storeId, {
    page,
    pageSize: PAGE_SIZE,
  });
  const updateStatus = useUpdateOrderDeliveryStatus();
  const createShipment = useCreateDeliveryShipment();

  const counts = useMemo(() => {
    const acc: Record<string, number> = { All: deliveries.length };
    for (const d of deliveries) acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, [deliveries]);

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      if (activeTab !== "All" && d.status !== activeTab) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const codeMatch =
          d.id.toLowerCase().includes(q) ||
          d.orderId.toLowerCase().includes(q) ||
          (d.trackingCode?.toLowerCase().includes(q) ?? false);
        if (!codeMatch) return false;
      }
      return true;
    });
  }, [deliveries, activeTab, searchTerm]);

  const handleConfirm = async (delivery: StoreDelivery) => {
    setConfirmingId(delivery.id);
    try {
      const res = await updateStatus.mutateAsync({
        deliveryId: delivery.id,
        data: { status: "Confirmed", note: "Cửa hàng xác nhận đơn" },
      });
      if (res.data.isSuccess) toast.success(res.data.message || "Đã xác nhận đơn giao");
      else toast.error(res.data.message || "Không thể xác nhận đơn giao");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi xác nhận đơn giao");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCreateShipment = async (delivery: StoreDelivery) => {
    setShippingId(delivery.id);
    try {
      const res = await createShipment.mutateAsync(delivery.id);
      if (res.data.isSuccess) toast.success(res.data.message || "Đã tạo vận đơn thành công");
      else toast.error(res.data.message || "Không thể tạo vận đơn");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tạo vận đơn");
    } finally {
      setShippingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => {
            const count = counts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {activeTab !== tab.value && count > 0 && (
                  <span className="ml-1.5 rounded-full bg-gray-200/60 px-1.5 py-0.5 text-[10px] text-gray-600 font-medium">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn / mã vận đơn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {listStatus === "loading" && deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Đang tải đơn giao...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-base font-semibold text-gray-900">Không có đơn giao nào</h3>
          <p className="text-sm text-gray-500 mt-1">Khi có khách đặt hàng, đơn giao sẽ hiện ở đây.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-32">Mã đơn giao</th>
                <th className="p-4 w-32">Ngày tạo</th>
                <th className="p-4 w-32">Tạm tính</th>
                <th className="p-4 w-28">Phí ship</th>
                <th className="p-4 w-40">Mã vận đơn</th>
                <th className="p-4 w-36">Trạng thái</th>
                <th className="p-4 w-44 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => {
                const meta = DELIVERY_STATUS_MAP[d.status] ?? {
                  label: d.status,
                  className: "bg-gray-100 text-gray-700 border-gray-200",
                };
                const busyConfirm = confirmingId === d.id;
                const busyShip = shippingId === d.id;

                return (
                  <tr key={d.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-gray-900">#{d.id.substring(0, 8)}</td>
                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatOrderDate(d.createdAt)}
                    </td>
                    <td className="p-4 font-semibold text-gray-800 whitespace-nowrap">
                      {formatVnd(d.subtotal)}
                    </td>
                    <td className="p-4 text-gray-700 whitespace-nowrap">{formatVnd(d.shippingFee)}</td>
                    <td className="p-4 font-mono text-xs text-gray-700">
                      {d.trackingCode ? d.trackingCode : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {d.status === "Pending" && (
                        <button
                          onClick={() => handleConfirm(d)}
                          disabled={busyConfirm}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          {busyConfirm ? <Loader2 size={13} className="animate-spin" /> : <Package size={13} />}
                          Nhận đơn
                        </button>
                      )}
                      {d.status === "Confirmed" && (
                        <button
                          onClick={() => handleCreateShipment(d)}
                          disabled={busyShip}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          {busyShip ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
                          Tạo đơn ship
                        </button>
                      )}
                      {d.status !== "Pending" && d.status !== "Confirmed" && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
          <span>
            Trang {pagination.page} / {pagination.totalPages} · {pagination.totalCount} đơn giao
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
