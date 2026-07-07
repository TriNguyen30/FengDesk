import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import StaffTable from "./StaffTable";
import InviteStaffModal from "./InviteStaffModal";
import RemoveStaffDialog from "./RemoveStaffDialog";
import { useShopStaff } from "@/features/shop/hooks/useShopStaff";
import type { StoreStaff } from "@/features/shop/types/shop";

interface Props {
  storeId: string;
}

export function ShopStaffSection({ storeId }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<StoreStaff | null>(null);

  const { staff, isLoading } = useShopStaff(storeId);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Quản lý nhân viên</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tìm và mời người dùng — họ sẽ nhận thông báo và cần đồng ý mới có quyền nhận đơn / ship.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-95 sm:self-auto cursor-pointer"
        >
          <UserPlus size={16} />
          Mời nhân viên
        </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <StaffTable
          staff={staff}
          onRemove={(s) => setRemoveTarget(s)}
          removingId={removeTarget?.id}
        />
      )}

      <InviteStaffModal
        open={inviteOpen}
        storeId={storeId}
        existingStaff={staff}
        onClose={() => setInviteOpen(false)}
      />
      <RemoveStaffDialog
        storeId={storeId}
        target={removeTarget}
        onClose={() => setRemoveTarget(null)}
      />
    </div>
  );
}
