import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, ChevronLeft, ChevronRight, Loader2, PackageSearch, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { model3DQueueApi } from "@/features/products/api/model3dQueue.api";
import type { Model3DRequestQueueItem, Model3DRequestStatus } from "@/features/products/types/model3d";
import Model3DQueueItemModal from "@/features/manager/components/Model3DQueueItemModal";

type TabValue = "AwaitingStaff" | "InProgress" | "Failed" | "Succeeded" | "Rejected" | "All";

const PAGE_SIZE = 20;
const TABS: { value: TabValue; label: string }[] = [
  { value: "AwaitingStaff", label: "Chờ xử lý" },
  { value: "InProgress", label: "Đang xử lý" },
  { value: "Failed", label: "Cần xử lý lại" },
  { value: "Succeeded", label: "Hoàn tất" },
  { value: "Rejected", label: "Đã từ chối" },
  { value: "All", label: "Tất cả" },
];

const STATUS_LABEL: Record<Model3DRequestStatus, string> = {
  Queued: "Đang chờ",
  Processing: "Đang tạo",
  AwaitingStaff: "Chờ xử lý",
  InProgress: "Đang xử lý",
  Succeeded: "Hoàn tất",
  Failed: "Cần xử lý lại",
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
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Model3DRequestQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Partial<Record<Model3DRequestStatus, number>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Model3DRequestQueueItem | null>(null);
  const autoSelectedWorkTab = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const params = activeTab === "All"
        ? { skip: page * PAGE_SIZE, take: PAGE_SIZE }
        : { status: activeTab as Model3DRequestStatus, skip: page * PAGE_SIZE, take: PAGE_SIZE };
      const res = await model3DQueueApi.getQueue(params);
      if (!res.data.isSuccess) throw new Error(res.data.message || "Không tải được hàng chờ");
      setItems(res.data.data.items);
      setTotal(res.data.data.total);
      setStatusCounts(res.data.data.statusCounts ?? {});
      if (!autoSelectedWorkTab.current && activeTab === "AwaitingStaff" && res.data.data.total === 0) {
        const counts = res.data.data.statusCounts ?? {};
        const nextTab = (counts.InProgress ?? 0) > 0
          ? "InProgress"
          : (counts.Failed ?? 0) > 0 ? "Failed" : null;
        autoSelectedWorkTab.current = true;
        if (nextTab) {
          setPage(0);
          setActiveTab(nextTab);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Lỗi khi tải hàng chờ model 3D");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeTab !== "AwaitingStaff" && activeTab !== "InProgress") return;
    const interval = window.setInterval(() => load(true), 10_000);
    return () => window.clearInterval(interval);
  }, [activeTab, load]);

  const allCount = useMemo(
    () => Object.values(statusCounts).reduce((sum, count) => sum + (count ?? 0), 0),
    [statusCounts],
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const changeTab = (tab: TabValue) => {
    setActiveTab(tab);
    setPage(0);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Box className="text-primary" size={22} />
            Hàng chờ Model 3D
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Xử lý yêu cầu tạo mới và tạo lại model 3D theo từng ảnh sản phẩm.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : undefined} />
          Làm mới
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((tab) => {
          const count = tab.value === "All" ? allCount : statusCounts[tab.value] ?? 0;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => changeTab(tab.value)}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold cursor-pointer ${
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === tab.value ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <PackageSearch size={32} className="mb-2 stroke-1 text-gray-300" />
            <p className="text-sm">Không có yêu cầu nào ở trạng thái này.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100">
                  {item.productImageUrl
                    ? <img src={item.productImageUrl} alt="" className="h-full w-full object-cover" />
                    : <Box size={20} className="text-gray-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{item.productName}</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      {item.requestType === "Initial" ? "Tạo mới" : "Tạo lại"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {item.storeName} · {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </p>
                  {item.internalFailureReason && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                      {item.internalFailureReason === "InsufficientCredits" ? "Meshy hết credit" : "Lần tạo trước gặp lỗi"}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[item.status]}`}>
                  {STATUS_LABEL[item.status]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total} yêu cầu</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <span>{page + 1}/{totalPages}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      <Model3DQueueItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onChanged={() => load(true)} />
    </div>
  );
}
