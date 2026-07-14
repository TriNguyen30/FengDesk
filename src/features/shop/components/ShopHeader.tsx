import { Store, MessageSquare, Heart, Truck, Users } from "lucide-react";
import { Shop } from "../types/shop";

interface ShopHeaderProps {
  shop: Shop;
  totalProductsCount: number;
  onChatClick: () => void;
  /** Đang mở phòng chat — disable nút để chặn double-click tạo phòng trùng. */
  chatDisabled?: boolean;
  onFollowClick: () => void;
  joinedTimeAgo: string;
  /**
   * Viewer thuộc cửa hàng (owner/co-owner/staff) — ẩn nút "Theo dõi" để không tự follow shop mình,
   * và đổi sang nút quản lý đơn ship + label số lượt theo dõi.
   */
  isMember?: boolean;
  onManageDeliveriesClick?: () => void;
}

// TODO: BE chưa có cột followerCount/followerSummary; tạm dùng hằng số khớp với mock ở phần stats.
const FOLLOWER_COUNT_LABEL = "2.4k";

export function ShopHeader({
  shop,
  totalProductsCount,
  onChatClick,
  chatDisabled = false,
  onFollowClick,
  joinedTimeAgo,
  isMember = false,
  onManageDeliveriesClick,
}: ShopHeaderProps) {
  return (
    <div className="mb-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Left */}
        <div className="flex shrink-0 items-start gap-4 lg:w-[360px] lg:border-r lg:border-gray-200 lg:pr-8">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50 mt-4">
              <Store className="h-9 w-9 text-emerald-700" />
            </div>

            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
          </div>

          {/* Shop Info */}
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 title={shop.name} className="truncate text-xl font-bold text-gray-900">
              {shop.name}
            </h1>

            <p className="mt-1 text-xs font-medium text-emerald-600">
              {isMember ? "Cửa hàng của bạn" : "Đang hoạt động"}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {isMember ? (
                <>
                  <button
                    onClick={onManageDeliveriesClick}
                    className="flex h-8 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
                  >
                    <Truck size={15} />
                    <span className="whitespace-nowrap">Quản lý đơn ship</span>
                  </button>
                  <span className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
                    <Users size={13} />
                    <span className="whitespace-nowrap">{FOLLOWER_COUNT_LABEL} người theo dõi</span>
                  </span>
                </>
              ) : (
                <>
                  <button
                    onClick={onChatClick}
                    disabled={chatDisabled}
                    className="flex h-8 w-[140px] items-center justify-center gap-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MessageSquare size={15} />
                    <span className="whitespace-nowrap">Chat ngay</span>
                  </button>

                  <button
                    onClick={onFollowClick}
                    className="flex h-8 w-[140px] items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 active:scale-95 cursor-pointer"
                  >
                    <Heart size={15} />
                    <span className="whitespace-nowrap">Theo dõi</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="grid flex-1 grid-cols-2 gap-x-12 gap-y-6 lg:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">Đánh Giá</p>
            <p className="mt-1 text-xm font-semibold text-gray-900">
              4.9 <span className="text-xs font-normal text-gray-500">(98 đánh giá)</span>
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Sản Phẩm</p>
            <p className="mt-1 text-xm font-semibold text-gray-900">{totalProductsCount}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Tỉ Lệ Phản Hồi</p>
            <p className="mt-1 text-xm font-semibold text-gray-900">99%</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Thời Gian Phản Hồi</p>
            <p className="mt-1 text-xm font-semibold text-gray-900">Trong vài giờ</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Tham Gia</p>
            <p className="mt-1 text-xm font-semibold text-gray-900">{joinedTimeAgo}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Người Theo Dõi</p>
            <p className="mt-1 text-xm font-semibold text-gray-900">{FOLLOWER_COUNT_LABEL}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
