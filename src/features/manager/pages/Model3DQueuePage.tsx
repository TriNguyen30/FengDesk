import { useCallback, useEffect, useState } from "react";
import { Box, Loader2, RefreshCw, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { model3DQueueApi } from "@/features/products/api/model3dQueue.api";
import type { Model3DRequestQueueItem, Model3DRequestStatus } from "@/features/products/types/model3d";
import Model3DQueueItemModal from "@/features/manager/components/Model3DQueueItemModal";

type TabValue = "AwaitingStaff" | "InProgress" | "StuckInitial" | "Succeeded" | "Rejected" | "All";

const TABS: { value: TabValue; label: string }[] = [
  { value: "AwaitingStaff", label: "Chờ xử lý" },
  { value: "InProgress", label: "Đang xử lý" },
  { value: "StuckInitial", label: "Kẹt tự động (hết credit)" },
  { value: "Succeeded", label: "Hoàn tất" },
  { value: "Rejected", label: "Đã từ chối" },
  { value: "All", label: "Tất cả" },
];

const STATUS_LABEL: Record<Model3DRequestStatus, string> = {
  Queued: "Đang chờ",
  Processing: "Đang tạo (tự động)",
  AwaitingStaff: "Chờ sàn xử lý",
  InProgress: "Sàn đang xử lý",
  Succeeded: "Hoàn tất",
  Failed: "Thất bại",
  Rejected: "Đã từ chối",
};

const STATUS_STYLE: Record<Model3DRequestStatus, string> = {
  Queued: "bg-amber-50 text-amber-700",
  Processing: "bg-blue-50 text-blue-700",
  AwaitingStaff: "bg-amber-50 text-amber-700",
  InProgress: "bg-blue-50 text-blue-700",
  Succeeded: "bg-green-50 text-green-700",
  Failed: "bg-red-50 text-red-700",
  Rejected: "bg-gray-100 text-gray-500",
};

export default function Model3DQueuePage() {
  const [activeTab, setActiveTab] = useState<TabValue>("AwaitingStaff");
  const [items, setItems] = useState<Model3DRequestQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Model3DRequestQueueItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params =
        activeTab === "All"
          ? {}
          : activeTab === "StuckInitial"
            ? { status: "Queued" as const, reason: "InsufficientCredits" as const }
            : { status: activeTab as Model3DRequestStatus };
      const res = await model3DQueueApi.getQueue({ ...params, take: 100 });
      if (res.data.isSuccess) {
        setItems(res.data.data.items);
        setTotal(res.data.data.total);
      } else {
        toast.error(res.data.message || "Không tải được hàng chờ");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải hàng chờ model 3D");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Box className="text-primary" size={22} />
            Hàng chờ Model 3D
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Xử lý thủ công yêu cầu tạo lại model 3D (Regenerate) từ các cửa hàng.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
          Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <PackageSearch size={32} className="stroke-1 text-gray-300 mb-2" />
            <p className="text-sm">Không có yêu cầu nào ở trạng thái này.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{item.productName}</p>
                  <p className="truncate text-xs text-gray-400 mt-0.5">
                    {item.storeName} · {item.requestType === "Initial" ? "Tạo lần đầu" : "Tạo lại"} ·{" "}
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[item.status]}`}
                >
                  {STATUS_LABEL[item.status]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <p className="text-xs text-gray-400">Hiển thị {items.length} / {total} yêu cầu.</p>
      )}

      <Model3DQueueItemModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onChanged={load}
      />
    </div>
  );
}
