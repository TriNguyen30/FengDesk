import { Store, Phone, Clock, MapPin } from "lucide-react";
import { Shop } from "../types/shop";

interface ShopSidebarProps {
  shop: Shop;
  shopAddressText: string;
}

export function ShopSidebar({ shop, shopAddressText }: ShopSidebarProps) {
  return (
    <aside className="lg:col-span-1 space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-1.5">
          <Store size={16} className="text-primary" />
          Hồ sơ cửa hàng
        </h3>

        <div className="space-y-4 text-sm text-gray-600">
          {shop.description && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Giới thiệu
              </p>
              <p className="text-gray-600 leading-relaxed text-xs whitespace-pre-line">
                {shop.description}
              </p>
            </div>
          )}

          <div className="flex items-start gap-3 pt-2">
            <Phone className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Hotline liên hệ
              </p>
              <p className="font-semibold text-primary mt-0.5">{shop.hotline || "Chưa cập nhật"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Giờ hoạt động
              </p>
              <p className="font-medium text-gray-800 mt-0.5">
                {shop.openingHours || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Địa chỉ cửa hàng
              </p>
              <p className="font-medium text-gray-800 mt-0.5 text-xs leading-relaxed">
                {shopAddressText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
