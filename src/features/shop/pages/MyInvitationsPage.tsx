import { Inbox, Loader2, RefreshCw } from "lucide-react";
import InvitationCard from "@/features/shop/components/InvitationCard";
import { useMyStoreInvitations } from "@/features/shop/hooks/useShopStaff";

export default function MyInvitationsPage() {
  const { invitations, isLoading, refetch } = useMyStoreInvitations();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Lời mời làm nhân viên</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Các cửa hàng đã mời bạn tham gia — chấp nhận để có quyền nhận đơn và giao hàng.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
          <Inbox size={36} className="mb-2 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">Không có lời mời nào</p>
          <p className="mt-1 text-xs text-gray-500">
            Khi ai đó mời bạn làm nhân viên, lời mời sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <InvitationCard key={inv.id} invitation={inv} />
          ))}
        </div>
      )}
    </div>
  );
}
