import { useState } from "react";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useCreateVoucher, voucherErrorMessage } from "../hooks/useVouchers";
import type { CreateVoucherPayload } from "../types/voucher";

const EMPTY: CreateVoucherPayload = {
  code: "",
  name: "",
  description: "",
  minOrderSubtotal: 0,
  maxDiscountAmount: null,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  usageLimitPerUser: null,
  isAutoApply: false,
};

/** Ô số để trống = không giới hạn (null) — khác với 0. */
const toNullableNumber = (v: string) => (v.trim() === "" ? null : Number(v));
/** `datetime-local` không mang múi giờ — đổi sang ISO (UTC) trước khi gửi. */
const toIso = (v: string) => (v ? new Date(v).toISOString() : null);

const inputClass =
  "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30";

/**
 * Tạo mã miễn phí vận chuyển do sàn tài trợ. Mức giảm thực tế của mỗi cửa hàng luôn ≤ phí sàn 8% của cửa hàng
 * đó (BE tự chặn) — form chỉ nhận điều kiện áp dụng. Kiểm tra dữ liệu nằm ở BE; lỗi hiện đúng câu BE trả.
 */
export function VoucherFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<CreateVoucherPayload>(EMPTY);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const createVoucher = useCreateVoucher();

  const set = <K extends keyof CreateVoucherPayload>(key: K, value: CreateVoucherPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const close = () => {
    setForm(EMPTY);
    setStartsAt("");
    setEndsAt("");
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createVoucher.mutateAsync({
        ...form,
        code: form.code.trim().toUpperCase(),
        startsAt: toIso(startsAt),
        endsAt: toIso(endsAt),
      });
      if (!res.isSuccess) {
        toast.error(res.message || "Không tạo được mã giảm giá");
        return;
      }
      toast.success(`Đã tạo mã ${res.data.code}`);
      close();
    } catch (err) {
      toast.error(voucherErrorMessage(err, "Không tạo được mã giảm giá"));
    }
  };

  return (
    <Modal open={open} title="Tạo mã miễn phí vận chuyển" onClose={close}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-gray-700">
            <span>Mã *</span>
            <input
              required
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="VD: FREESHIP300"
              className={`${inputClass} font-mono uppercase`}
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-gray-700">
            <span>Tên hiển thị *</span>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block space-y-1.5 text-sm font-semibold text-gray-700">
          <span>Mô tả</span>
          <textarea
            rows={2}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold text-gray-700">
            <span>Tiền hàng tối thiểu (VNĐ)</span>
            <MoneyInput
              value={form.minOrderSubtotal}
              onChange={(v) => set("minOrderSubtotal", v ?? 0)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-gray-700">
            <span>Giảm tối đa mỗi đơn (VNĐ)</span>
            <MoneyInput
              placeholder="Không giới hạn"
              value={form.maxDiscountAmount ?? null}
              onChange={(v) => set("maxDiscountAmount", v)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-gray-700">
            <span>Tổng lượt dùng</span>
            <input
              type="number"
              min={1}
              placeholder="Không giới hạn"
              value={form.usageLimit ?? ""}
              onChange={(e) => set("usageLimit", toNullableNumber(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-gray-700">
            <span>Lượt mỗi khách</span>
            <input
              type="number"
              min={1}
              placeholder="Không giới hạn"
              value={form.usageLimitPerUser ?? ""}
              onChange={(e) => set("usageLimitPerUser", toNullableNumber(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-gray-700">
            <span>Bắt đầu</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1.5 text-sm font-semibold text-gray-700">
            <span>Kết thúc</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isAutoApply}
            onChange={(e) => set("isAutoApply", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Tự áp khi đơn đủ điều kiện (khách không cần nhập mã)
        </label>

        <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-gray-600">
          Sàn tài trợ khoản giảm: mỗi cửa hàng trong đơn được giảm tối đa bằng phí vận chuyển của
          cửa hàng đó và không vượt phí sàn 8% tiền hàng của cửa hàng.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createVoucher.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
          >
            {createVoucher.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Tạo mã
          </button>
        </div>
      </form>
    </Modal>
  );
}
