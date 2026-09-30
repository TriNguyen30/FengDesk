import { useState } from "react";
import { Loader2, Plus, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { VoucherFormModal } from "../components/VoucherFormModal";
import { useSetVoucherActive, useVoucherList, voucherErrorMessage } from "../hooks/useVouchers";
import type { Voucher } from "../types/voucher";

const formatVnd = (v: number) => v.toLocaleString("vi-VN") + "đ";
const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleString("vi-VN") : "—");

/** Trạng thái hiển thị gộp bật/tắt + thời hạn + lượt — người quản lý nhìn một cột là biết mã có đang chạy không. */
function statusOf(v: Voucher): { label: string; className: string } {
  const now = Date.now();
  if (!v.isActive) return { label: "Đã tắt", className: "bg-gray-100 text-gray-600" };
  if (v.startsAt && new Date(v.startsAt).getTime() > now)
    return { label: "Chưa bắt đầu", className: "bg-blue-50 text-blue-700" };
  if (v.endsAt && new Date(v.endsAt).getTime() < now)
    return { label: "Hết hạn", className: "bg-amber-50 text-amber-700" };
  if (v.usageLimit != null && v.usedCount >= v.usageLimit)
    return { label: "Hết lượt", className: "bg-amber-50 text-amber-700" };
  return { label: "Đang áp dụng", className: "bg-green-50 text-green-700" };
}

export default function ManageVouchersPage() {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const { data, isLoading, error } = useVoucherList(page);
  const setActive = useSetVoucherActive();

  const toggle = async (v: Voucher) => {
    try {
      const res = await setActive.mutateAsync({ id: v.id, isActive: !v.isActive });
      if (res.isSuccess) toast.success(`${res.data.isActive ? "Đã bật" : "Đã tắt"} mã ${v.code}`);
      else toast.error(res.message || "Không cập nhật được mã");
    } catch (err) {
      toast.error(voucherErrorMessage(err, "Không cập nhật được mã"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <TicketPercent className="h-6 w-6 text-primary" />
            Mã giảm giá
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Miễn phí vận chuyển do sàn tài trợ — trừ vào phí sàn, không ảnh hưởng tiền cửa hàng
            nhận.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Tạo mã
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-red-600">
            {voucherErrorMessage(error, "Không tải được mã giảm giá")}
          </p>
        ) : !data || data.items.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">Chưa có mã giảm giá nào.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Điều kiện</th>
                <th className="px-4 py-3">Thời hạn</th>
                <th className="px-4 py-3">Lượt dùng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((v) => {
                const status = statusOf(v);
                return (
                  <tr key={v.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-gray-900">{v.code}</p>
                      <p className="text-xs text-gray-500">{v.name}</p>
                      {v.isAutoApply && (
                        <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                          Tự áp
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p>Từ {formatVnd(v.minOrderSubtotal)} tiền hàng</p>
                      {v.maxDiscountAmount != null && (
                        <p className="text-xs text-gray-500">
                          Giảm tối đa {formatVnd(v.maxDiscountAmount)}/đơn
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <p>{formatDate(v.startsAt)}</p>
                      <p>→ {formatDate(v.endsAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {v.usedCount}
                      {v.usageLimit != null ? ` / ${v.usageLimit}` : ""}
                      {v.usageLimitPerUser != null && (
                        <p className="text-xs text-gray-500">Tối đa {v.usageLimitPerUser}/khách</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggle(v)}
                        disabled={setActive.isPending}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                      >
                        {v.isActive ? "Tắt" : "Bật"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 cursor-pointer"
          >
            Trước
          </button>
          <span className="text-gray-600">
            {page} / {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 cursor-pointer"
          >
            Sau
          </button>
        </div>
      )}

      <VoucherFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
