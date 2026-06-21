import { Store, MessageSquare, Heart } from "lucide-react";
import { Shop } from "../types/shop";

interface ShopHeaderProps {
  shop: Shop;
  totalProductsCount: number;
  onChatClick: () => void;
  onFollowClick: () => void;
  joinedTimeAgo: string;
}

export function ShopHeader({
  shop,
  totalProductsCount,
  onChatClick,
  onFollowClick,
  joinedTimeAgo,
}: ShopHeaderProps) {
  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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

            <p className="mt-1 text-xs font-medium text-emerald-600">Đang hoạt động</p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={onChatClick}
                className="flex h-11 w-[140px] items-center justify-center gap-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
              >
                <MessageSquare size={15} />
                <span className="whitespace-nowrap">Chat ngay</span>
              </button>

              <button
                onClick={onFollowClick}
                className="flex h-11 w-[140px] items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 active:scale-95"
              >
                <Heart size={15} />
                <span className="whitespace-nowrap">Theo dõi</span>
              </button>
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
            <p className="mt-1 text-xm font-semibold text-gray-900">2.4k</p>
          </div>
        </div>
      </div>
    </div>
  );
}
