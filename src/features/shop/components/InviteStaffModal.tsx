import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import Modal from "@/components/ui/Modal";
import UserSearchCombobox from "./UserSearchCombobox";
import { useAssignShopStaff } from "@/features/shop/hooks/useShopStaff";
import type { StoreStaff, UserSearchItem } from "@/features/shop/types/shop";

interface Props {
  open: boolean;
  storeId: string;
  /** Nhân viên hiện tại (Pending + Accepted) — disable trong dropdown để tránh mời trùng. */
  existingStaff: StoreStaff[];
  onClose: () => void;
}

export default function InviteStaffModal({ open, storeId, existingStaff, onClose }: Props) {
  const [selected, setSelected] = useState<UserSearchItem | null>(null);
  const assign = useAssignShopStaff(storeId);

  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  const disabledUserIds = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of existingStaff) {
      map[s.staffId] = s.status === "Pending" ? "Đã mời" : "Nhân viên";
    }
    return map;
  }, [existingStaff]);

  const handleSubmit = async () => {
    if (!selected) {
      toast.error("Vui lòng chọn người dùng để mời.");
      return;
    }
    try {
      const res = await assign.mutateAsync({ staffId: selected.id });
      if (!res.isSuccess) {
        toast.error(res.message || "Không thể gửi lời mời.");
        return;
      }
      toast.success(res.message || "Đã gửi lời mời.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi gửi lời mời.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Mời nhân viên">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Tìm người dùng <span className="text-red-500">*</span>
          </label>
          <UserSearchCombobox
            value={selected}
            onChange={setSelected}
            disabledUserIds={disabledUserIds}
            autoFocus={open}
            disabled={assign.isPending}
          />
          <p className="mt-2 text-xs text-gray-500">
            Người được mời sẽ nhận thông báo; họ cần đồng ý mới có quyền nhận đơn / ship cho cửa hàng.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={assign.isPending}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || assign.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {assign.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang gửi…
              </>
            ) : (
              <>
                <Send size={16} />
                Gửi lời mời
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
