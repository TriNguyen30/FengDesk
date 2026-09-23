import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/app/store";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Eye, Loader2, Package, Search, Truck, Check, UserPlus, X } from "lucide-react";
import {
  DeliveryDetailModal,
  useCreateDeliveryShipment,
  useStoreDeliveries,
  useUpdateOrderDeliveryStatus,
} from "@/features/orders";
import { devMarkDeliveryShippingDelivered, devMarkDeliveryDelivering } from "../api/delivery.api";
import { AssignStaffModal } from "./AssignStaffModal";
import type { StoreDelivery } from "@/features/orders";
import { formatOrderDate, formatVnd } from "@/features/orders/utils/orderUtils";
import Tabs from "@/components/ui/Tabs";

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
  const [shippingOutId, setShippingOutId] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [detailDeliveryId, setDetailDeliveryId] = useState<string | null>(null);
  const [assigningIds, setAssigningIds] = useState<string[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkConfirming, setIsBulkConfirming] = useState(false);
  const [isBulkShipping, setIsBulkShipping] = useState(false);
  const [isBulkShippingOut, setIsBulkShippingOut] = useState(false);
  const [isBulkDelivered, setIsBulkDelivered] = useState(false);

  const { deliveries, pagination, listStatus } = useStoreDeliveries(storeId, {
    page,
    pageSize: PAGE_SIZE,
  });
  const updateStatus = useUpdateOrderDeliveryStatus();
  const createShipment = useCreateDeliveryShipment();
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);

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

  const isEligibleForConfirm = (d: StoreDelivery) =>
    d.status === "Pending" &&
    ["Manager", "GardenOwner", "GardenStaff", "Admin"].some((role) => (currentUser?.role || "").includes(role));

  const isEligibleForAssignment = (d: StoreDelivery) =>
    ["Confirmed", "Preparing", "Shipped"].includes(d.status) &&
    !d.assignedStaffId &&
    ["Manager", "GardenOwner", "Admin"].some((role) => (currentUser?.role || "").includes(role));

  const isEligibleForShipmentCreation = (d: StoreDelivery) =>
    d.status === "Confirmed" &&
    (["Manager", "GardenOwner", "GardenStaff", "Admin"].some((role) => (currentUser?.role || "").includes(role)) || !!d.assignedStaffId);

  const isEligibleForShippingOut = (d: StoreDelivery) => d.status === "Preparing";
  const isEligibleForDelivered = (d: StoreDelivery) => d.status === "Shipped";

  const isEligibleForSelection = (d: StoreDelivery) => 
    isEligibleForAssignment(d) || 
    isEligibleForConfirm(d) || 
    isEligibleForShipmentCreation(d) ||
    isEligibleForShippingOut(d) ||
    isEligibleForDelivered(d);

  const eligibleFiltered = useMemo(() => filtered.filter(isEligibleForSelection), [filtered, currentUser]);
  const isAllSelected = eligibleFiltered.length > 0 && eligibleFiltered.every((d) => selectedIds.includes(d.id));

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !eligibleFiltered.some((d) => d.id === id)));
    } else {
      const newIds = [...selectedIds];
      eligibleFiltered.forEach((d) => {
        if (!newIds.includes(d.id)) newIds.push(d.id);
      });
      setSelectedIds(newIds);
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  const handleBulkConfirm = async () => {
    const pendingIds = deliveries.filter(d => selectedIds.includes(d.id) && d.status === "Pending").map(d => d.id);
    if (pendingIds.length === 0) return;
    
    setIsBulkConfirming(true);
    try {
      const results = await Promise.allSettled(
        pendingIds.map(id => 
          updateStatus.mutateAsync({
            deliveryId: id,
            data: { status: "Confirmed", note: "Cửa hàng xác nhận đơn" },
          })
        )
      );
      const successCount = results.filter(r => r.status === "fulfilled" && (r as any).value.data.isSuccess).length;
      if (successCount > 0) {
        toast.success(`Đã xác nhận ${successCount}/${pendingIds.length} đơn giao`);
        const successIds = pendingIds.filter((_, i) => results[i].status === "fulfilled" && (results[i] as any).value.data.isSuccess);
        setSelectedIds(prev => prev.filter(id => !successIds.includes(id)));
      } else {
        toast.error("Không thể xác nhận các đơn giao đã chọn");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi xác nhận đơn giao hàng loạt");
    } finally {
      setIsBulkConfirming(false);
    }
  };

  const handleBulkCreateShipment = async () => {
    const shipmentIds = deliveries
      .filter((d) => selectedIds.includes(d.id) && isEligibleForShipmentCreation(d))
      .map((d) => d.id);
    if (shipmentIds.length === 0) return;

    setIsBulkShipping(true);
    try {
      const results = await Promise.allSettled(
        shipmentIds.map((id) => createShipment.mutateAsync(id))
      );
      const successCount = results.filter(
        (r) => r.status === "fulfilled" && (r.value as any).data.isSuccess
      ).length;
      
      if (successCount > 0) {
        toast.success(`Đã tạo vận đơn thành công ${successCount}/${shipmentIds.length} đơn`);
        const successIds = shipmentIds.filter(
          (_, i) => results[i].status === "fulfilled" && (results[i] as any).value.data.isSuccess
        );
        setSelectedIds((prev) => prev.filter((id) => !successIds.includes(id)));
      } else {
        toast.error("Không thể tạo vận đơn cho các đơn đã chọn");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tạo vận đơn hàng loạt");
    } finally {
      setIsBulkShipping(false);
    }
  };

  const handleBulkSetShipped = async () => {
    const shippingOutIds = deliveries
      .filter((d) => selectedIds.includes(d.id) && isEligibleForShippingOut(d))
      .map((d) => d.id);
    if (shippingOutIds.length === 0) return;

    setIsBulkShippingOut(true);
    try {
      const results = await Promise.allSettled(
        shippingOutIds.map((id) => devMarkDeliveryDelivering(id))
      );
      const successCount = results.filter(
        (r) => r.status === "fulfilled" && ((r.value as any).isSuccess || (r.value as any).status === 200 || !(r.value as any).error)
      ).length;

      if (successCount > 0) {
        toast.success(`Đã cập nhật trạng thái đang giao ${successCount}/${shippingOutIds.length} đơn`);
        queryClient.invalidateQueries({ queryKey: ["store-deliveries"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        const successIds = shippingOutIds.filter(
          (_, i) => results[i].status === "fulfilled" && ((results[i].value as any).isSuccess || (results[i].value as any).status === 200 || !(results[i].value as any).error)
        );
        setSelectedIds((prev) => prev.filter((id) => !successIds.includes(id)));
      } else {
        toast.error("Không thể cập nhật trạng thái cho các đơn đã chọn");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái hàng loạt");
    } finally {
      setIsBulkShippingOut(false);
    }
  };

  const handleBulkSetDelivered = async () => {
    const deliveredIds = deliveries
      .filter((d) => selectedIds.includes(d.id) && isEligibleForDelivered(d))
      .map((d) => d.id);
    if (deliveredIds.length === 0) return;

    setIsBulkDelivered(true);
    try {
      const results = await Promise.allSettled(
        deliveredIds.map((id) => devMarkDeliveryShippingDelivered(id))
      );
      const successCount = results.filter(
        (r) => r.status === "fulfilled" && ((r.value as any).isSuccess || (r.value as any).status === 200 || !(r.value as any).error)
      ).length;

      if (successCount > 0) {
        toast.success(`Đã cập nhật trạng thái đã giao ${successCount}/${deliveredIds.length} đơn`);
        queryClient.invalidateQueries({ queryKey: ["store-deliveries"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        const successIds = deliveredIds.filter(
          (_, i) => results[i].status === "fulfilled" && ((results[i].value as any).isSuccess || (results[i].value as any).status === 200 || !(results[i].value as any).error)
        );
        setSelectedIds((prev) => prev.filter((id) => !successIds.includes(id)));
      } else {
        toast.error("Không thể cập nhật trạng thái cho các đơn đã chọn");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái hàng loạt");
    } finally {
      setIsBulkDelivered(false);
    }
  };

  const handleSetShipped = async (delivery: StoreDelivery) => {
    setShippingOutId(delivery.id);
    try {
      const res = await devMarkDeliveryDelivering(delivery.id) as any;
      if (res.isSuccess || res.status === 200 || !res.error) {
        toast.success("Đã cập nhật trạng thái đang giao");
        queryClient.invalidateQueries({ queryKey: ["store-deliveries"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái");
    } finally {
      setShippingOutId(null);
    }
  };

  const handleSetDelivered = async (delivery: StoreDelivery) => {
    setDeliveringId(delivery.id);
    try {
      const res = await devMarkDeliveryShippingDelivered(delivery.id) as any;
      if (res.isSuccess || res.status === 200 || !res.error) {
        toast.success("Đã cập nhật trạng thái đã giao");
        queryClient.invalidateQueries({ queryKey: ["store-deliveries"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        toast.error(res.message || "Không thể cập nhật trạng thái");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái");
    } finally {
      setDeliveringId(null);
    }
  };

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
        {/* Filter tab: chỉ đổi bộ lọc trên cùng một danh sách → KHÔNG bọc TabPanel, nếu không mỗi
            lần lọc sẽ nháy cả bảng. */}
        <Tabs
          items={TABS.map((tab) => ({ ...tab, count: counts[tab.value] ?? 0 }))}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="Lọc đơn giao theo trạng thái"
        />

        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectedIds.some(id => deliveries.find(d => d.id === id)?.status === "Pending") && (
            <button
              onClick={handleBulkConfirm}
              disabled={isBulkConfirming}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
            >
              {isBulkConfirming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Package size={16} />
              )}
              Nhận {selectedIds.filter(id => deliveries.find(d => d.id === id)?.status === "Pending").length} đơn
            </button>
          )}
          {selectedIds.some(id => isEligibleForAssignment(deliveries.find(d => d.id === id) as StoreDelivery)) && (
            <button
              onClick={() => setAssigningIds(selectedIds.filter(id => isEligibleForAssignment(deliveries.find(d => d.id === id) as StoreDelivery)))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-100 transition-all whitespace-nowrap cursor-pointer"
            >
              <UserPlus size={16} />
              Giao việc {selectedIds.filter(id => isEligibleForAssignment(deliveries.find(d => d.id === id) as StoreDelivery)).length} đơn
            </button>
          )}
          {selectedIds.some((id) => isEligibleForShipmentCreation(deliveries.find((d) => d.id === id) as StoreDelivery)) && (
            <button
              onClick={handleBulkCreateShipment}
              disabled={isBulkShipping}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
            >
              {isBulkShipping ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
              Tạo {selectedIds.filter((id) => isEligibleForShipmentCreation(deliveries.find((d) => d.id === id) as StoreDelivery)).length} đơn ship
            </button>
          )}
          {selectedIds.some((id) => isEligibleForShippingOut(deliveries.find((d) => d.id === id) as StoreDelivery)) && (
            <button
              onClick={handleBulkSetShipped}
              disabled={isBulkShippingOut}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
            >
              {isBulkShippingOut ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
              Bắt đầu giao {selectedIds.filter((id) => isEligibleForShippingOut(deliveries.find((d) => d.id === id) as StoreDelivery)).length} đơn
            </button>
          )}
          {selectedIds.some((id) => isEligibleForDelivered(deliveries.find((d) => d.id === id) as StoreDelivery)) && (
            <button
              onClick={handleBulkSetDelivered}
              disabled={isBulkDelivered}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
            >
              {isBulkDelivered ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Đã giao {selectedIds.filter((id) => isEligibleForDelivered(deliveries.find((d) => d.id === id) as StoreDelivery)).length} đơn
            </button>
          )}
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
          <p className="text-sm text-gray-500 mt-1">
            Khi có khách đặt hàng, đơn giao sẽ hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-40">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleAll}
                      disabled={eligibleFiltered.length === 0}
                      className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                      title="Chọn tất cả"
                    />
                    Mã đơn giao
                  </div>
                </th>
                <th className="p-4 w-32">Ngày tạo</th>
                <th className="p-4 w-32">Tạm tính</th>
                <th className="p-4 w-28">Phí ship</th>
                <th className="p-4 w-40">Mã vận đơn</th>
                <th className="p-4 w-36">Trạng thái</th>
                <th className="p-4 w-56 text-right">Thao tác</th>
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
                const busyShippingOut = shippingOutId === d.id;
                const busyDelivered = deliveringId === d.id;

                return (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-50/30 transition-colors cursor-pointer"
                    onClick={() => setDetailDeliveryId(d.id)}
                  >
                    <td className="p-4 font-mono font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        {isEligibleForSelection(d) ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(d.id)}
                            onChange={() => toggleOne(d.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        ) : (
                          <div className="w-3.5" />
                        )}
                        <span>
                          #{d.id.substring(0, 8)}
                          {d.isExchange && <span className="ml-2 rounded bg-violet-50 px-2 py-0.5 font-sans text-[10px] text-violet-700">Hàng đổi</span>}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatOrderDate(d.createdAt)}
                    </td>
                    <td className="p-4 font-semibold text-gray-800 whitespace-nowrap">
                      {formatVnd(d.subtotal)}
                    </td>
                    <td className="p-4 text-gray-700 whitespace-nowrap">
                      {formatVnd(d.shippingFee)}
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-700">
                      {d.trackingCode ? d.trackingCode : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td
                      className="p-4 text-right flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {d.status === "Pending" && (
                        <button
                          onClick={() => handleConfirm(d)}
                          disabled={busyConfirm || !["Manager", "GardenOwner", "GardenStaff", "Admin"].some(role => (currentUser?.role || "").includes(role))}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                        >
                          {busyConfirm ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Package size={13} />
                          )}
                          {d.isExchange ? "Xác nhận đơn đổi" : "Nhận đơn"}
                        </button>
                      )}
                      {d.status === "Confirmed" && (
                        <button
                          onClick={() => handleCreateShipment(d)}
                          disabled={busyShip || (!["Manager", "GardenOwner", "GardenStaff", "Admin"].some(role => (currentUser?.role || "").includes(role)) && !d.assignedStaffId)}
                          title={!["Manager", "GardenOwner", "GardenStaff", "Admin"].some(role => (currentUser?.role || "").includes(role)) && !d.assignedStaffId ? "Vui lòng giao việc cho nhân viên trước khi tạo đơn ship" : ""}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                        >
                          {busyShip ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Truck size={13} />
                          )}
                          {d.isExchange ? "Gửi hàng đổi" : "Tạo đơn ship"}
                        </button>
                      )}
                      {d.status === "Preparing" && (
                        <button
                          onClick={() => handleSetShipped(d)}
                          disabled={busyShippingOut}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                        >
                          {busyShippingOut ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Truck size={13} />
                          )}
                          Bắt đầu giao
                        </button>
                      )}
                      {d.status === "Shipped" && (
                        <button
                          onClick={() => handleSetDelivered(d)}
                          disabled={busyDelivered}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                        >
                          {busyDelivered ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Check size={13} />
                          )}
                          Đã giao
                        </button>
                      )}
                      {["Confirmed", "Preparing", "Shipped"].includes(d.status) && !d.assignedStaffId && ["Manager", "GardenOwner", "Admin"].some(role => (currentUser?.role || "").includes(role)) && (
                        <button
                          onClick={() => setAssigningIds([d.id])}
                          title="Giao cho nhân viên"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <UserPlus size={13} />
                          Giao việc
                        </button>
                      )}
                      <button
                        onClick={() => setDetailDeliveryId(d.id)}
                        title="Xem chi tiết đơn giao"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Eye size={13} />
                        Chi tiết
                      </button>
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

      <DeliveryDetailModal
        deliveryId={detailDeliveryId}
        open={detailDeliveryId !== null}
        onClose={() => setDetailDeliveryId(null)}
      />

      <AssignStaffModal
        open={assigningIds !== null}
        onClose={() => {
          setAssigningIds(null);
          // Auto clear selected ids that were assigned (simple heuristic: clear all)
          setSelectedIds([]);
        }}
        storeId={storeId}
        deliveryIds={assigningIds || []}
      />
    </div>
  );
}
