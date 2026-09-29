import { useState } from "react";
import { History, Loader2, Percent } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { formatMoneyInput } from "@/utils/money";
import { usePlatformFeePolicy } from "@/features/shop/hooks/usePlatformFeePolicy";
import { computeCommission, computeSellerNet } from "@/features/shop/utils/platform-fee";
import {
  platformFeeErrorMessage,
  usePlatformFeeHistory,
  useUpdatePlatformFee,
} from "../hooks/usePlatformFee";

const MAX_PERCENT = 30;
const EXAMPLE_PRICE = 100_000;

const formatPercent = (rate: number) =>
  `${(Math.round(rate * 10000) / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleString("vi-VN") : "—");

/** "8,25" / "8.25" → 0.0825; sai định dạng, ngoài 0–30% hoặc quá 2 chữ số thập phân ⇒ null. */
function parsePercent(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(normalized)) return null;
  const percent = Number(normalized);
  if (percent < 0 || percent > MAX_PERCENT) return null;
  // Làm việc bằng số nguyên phần vạn để 8.25 không thành 0.08250000000000001.
  return Math.round(percent * 100) / 10000;
}

/** Ví dụ một món 100,000đ: sàn thu bao nhiêu, nhà vườn nhận bao nhiêu. */
function ExampleSplit({ rate, label }: { rate: number; label: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs">
      <p className="mb-1 font-semibold text-gray-500">{label}</p>
      <p className="text-gray-700">
        Sàn thu{" "}
        <b className="text-red-600">{formatMoneyInput(computeCommission(EXAMPLE_PRICE, rate))}đ</b>
        {" · "}Nhà vườn nhận{" "}
        <b className="text-primary">{formatMoneyInput(computeSellerNet(EXAMPLE_PRICE, rate))}đ</b>
      </p>
    </div>
  );
}

export default function ManagePlatformFeePage() {
  const { policy, isLoading } = usePlatformFeePolicy();
  const { history, isLoading: historyLoading, error: historyError } = usePlatformFeeHistory();
  const update = useUpdatePlatformFee();
  const [percentInput, setPercentInput] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);

  const newRate = parsePercent(percentInput);
  const unchanged = newRate != null && policy != null && newRate === policy.commissionRate;
  const inputError =
    percentInput.trim() === ""
      ? null
      : newRate == null
        ? `Nhập số từ 0 đến ${MAX_PERCENT}, tối đa 2 chữ số thập phân (vd 8,25).`
        : unchanged
          ? "Trùng với mức đang áp dụng."
          : null;

  const submit = async () => {
    if (newRate == null) return;
    try {
      const res = await update.mutateAsync({
        commissionRate: newRate,
        note: note.trim() || undefined,
      });
      if (!res.isSuccess) {
        toast.error(res.message || "Không đổi được phí sàn");
        return;
      }
      toast.success(`Đã áp dụng phí sàn ${formatPercent(newRate)} cho đơn mới`);
      setPercentInput("");
      setNote("");
      setConfirming(false);
    } catch (err) {
      toast.error(platformFeeErrorMessage(err, "Không đổi được phí sàn"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Percent className="h-6 w-6 text-primary" />
          Phí sàn
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Phần trăm sàn giữ lại trên tiền hàng mỗi đơn giao thành công. Mã freeship do sàn tài trợ
          được trừ vào chính khoản phí này, không bao giờ vượt quá nó.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Mức hiện tại */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Đang áp dụng
          </p>
          {isLoading || !policy ? (
            <Loader2 className="mt-4 h-6 w-6 animate-spin text-gray-300" />
          ) : (
            <>
              <p className="mt-2 text-4xl font-bold text-primary" data-testid="current-fee-rate">
                {formatPercent(policy.commissionRate)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Từ {policy.effectiveFrom ? formatDate(policy.effectiveFrom) : "mặc định hệ thống"} ·
                tiền về nhà vườn sau {policy.payoutHoldDays} ngày
              </p>
              <div className="mt-4">
                <ExampleSplit rate={policy.commissionRate} label="Ví dụ một món 100,000đ" />
              </div>
            </>
          )}
        </div>

        {/* Đổi mức */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">Đổi phí sàn</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-500">
            <li>Chỉ áp cho đơn đặt SAU lúc lưu — đơn đã đặt giữ nguyên tỉ lệ đã chốt.</li>
            <li>Người bán thấy ngay số tiền thực nhận mới khi nhập giá sản phẩm.</li>
            <li>Mỗi lần đổi được ghi lại kèm người đổi và lý do.</li>
          </ul>

          <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
            <label className="space-y-1.5 text-sm font-semibold text-gray-700">
              <span>Mức mới (%)</span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={percentInput}
                  onChange={(e) => setPercentInput(e.target.value)}
                  placeholder="vd 8,5"
                  aria-invalid={inputError != null}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-8 text-sm font-semibold text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  %
                </span>
              </div>
            </label>
            <label className="space-y-1.5 text-sm font-semibold text-gray-700">
              <span>Lý do (hiện trong lịch sử)</span>
              <input
                type="text"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="vd Điều chỉnh theo chính sách quý IV"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </label>
          </div>
          {inputError && <p className="mt-2 text-xs text-red-600">{inputError}</p>}
          {newRate != null && !unchanged && policy && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <ExampleSplit
                rate={policy.commissionRate}
                label={`Hiện tại (${formatPercent(policy.commissionRate)})`}
              />
              <ExampleSplit rate={newRate} label={`Sau khi đổi (${formatPercent(newRate)})`} />
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={newRate == null || unchanged || update.isPending}
              onClick={() => setConfirming(true)}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300 cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>

      {/* Lịch sử */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-900">Lịch sử thay đổi</h2>
        </div>
        {historyLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải...
          </div>
        ) : historyError ? (
          <p className="py-10 text-center text-sm text-red-600">
            {platformFeeErrorMessage(historyError, "Không tải được lịch sử phí sàn")}
          </p>
        ) : history.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">Chưa có thay đổi nào.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Mức</th>
                <th className="px-4 py-3">Áp dụng từ</th>
                <th className="px-4 py-3">Người đổi</th>
                <th className="px-4 py-3">Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((h, i) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatPercent(h.commissionRate)}
                    {i === 0 && (
                      <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                        Hiện tại
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(h.effectiveFrom)}</td>
                  <td className="px-4 py-3 text-gray-600">{h.changedByName ?? "Hệ thống"}</td>
                  <td className="px-4 py-3 text-gray-500">{h.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={confirming} title="Xác nhận đổi phí sàn" onClose={() => setConfirming(false)}>
        {newRate != null && policy && (
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              Phí sàn đổi từ <b>{formatPercent(policy.commissionRate)}</b> sang{" "}
              <b className="text-primary">{formatPercent(newRate)}</b>, áp dụng ngay cho mọi đơn đặt
              từ bây giờ. Đơn đã đặt không bị ảnh hưởng.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={update.isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:bg-gray-300 cursor-pointer"
              >
                {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
