import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useRemoveShopStaff } from "@/features/shop/hooks/useShopStaff";
import type { StoreStaff } from "@/features/shop/types/shop";

interface Props {
  storeId: string;
  target: StoreStaff | null;
  onClose: () => void;
}

export default function RemoveStaffDialog({ storeId, target, onClose }: Props) {
  const remove = useRemoveShopStaff(storeId);
  const isPending = target?.status === "Pending";
  const title = isPending ? "Huỷ lời mời" : "Gỡ nhân viên";
  const description = isPending ? (
    <>
      Huỷ lời mời gửi đến <strong>{target?.staffName || target?.staffEmail}</strong>? Họ sẽ không
      thể chấp nhận nữa.
    </>
  ) : (
    <>
      Sau khi gỡ, <strong>{target?.staffName || target?.staffEmail}</strong> sẽ mất quyền nhận đơn /
      ship cho cửa hàng này.
    </>
  );
  const confirmLabel = isPending ? "Huỷ lời mời" : "Xác nhận gỡ";
  const pendingLabel = isPending ? "Đang huỷ…" : "Đang gỡ…";

  const onConfirm = async () => {
    if (!target) return;
    try {
      const res = await remove.mutateAsync(target.id);
      if (!res.isSuccess) {
        toast.error(
          res.message || (isPending ? "Không thể huỷ lời mời." : "Không thể gỡ nhân viên."),
        );
        return;
      }
      toast.success(res.message || (isPending ? "Đã huỷ lời mời." : "Đã gỡ nhân viên."));
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi.");
    }
  };

  return (
    <Modal open={!!target} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={remove.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {remove.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {pendingLabel}
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
