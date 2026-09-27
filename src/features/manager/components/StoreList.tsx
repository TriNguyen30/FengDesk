import { useState } from "react";
import {
  Store as StoreIcon,
  Loader2,
  Phone,
  Clock,
  Edit,
  Trash2,
  Crown,
  Shield,
  MapPin,
} from "lucide-react";
import type { Shop } from "@/features/shop/types/shop";

interface StoreListProps {
  stores: Shop[];
  selectedStore: Shop | null;
  onSelectStore: (store: Shop) => void;
  onEditStore: (store: Shop) => void;
  onDeleteStore: (store: Shop, hard: boolean) => void;
  loading: boolean;
  currentUserId?: string;
  userRoles?: string[];
  isAdmin?: boolean;
}

export function StoreList({
  stores,
  selectedStore,
  onSelectStore,
  onEditStore,
  onDeleteStore,
  loading,
  currentUserId,
  userRoles = [],
  isAdmin,
}: StoreListProps) {
  const isAdminUser = isAdmin ?? userRoles.some((r) => ["Admin", "SystemAdmin"].includes(r));
  const [filterMode, setFilterMode] = useState<"all" | "mine">("all");

  const isStoreOwner = (store: Shop) => {
    return store.isOwner || (!!currentUserId && store.ownerUserId === currentUserId);
  };

  const isStoreStaff = (store: Shop) => {
    return (store as any).isStaff && !isStoreOwner(store);
  };

  const myStores = stores.filter((s) => isStoreOwner(s) || (s as any).isStaff);
  const displayedStores = !isAdminUser ? stores : filterMode === "mine" ? myStores : stores;

  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <StoreIcon size={16} className="text-emerald-600" />
            Danh sách chi nhánh ({stores.length})
          </h3>
        </div>

        {/* Tab Filter: Tất cả vs Cửa hàng của tôi (Chỉ dành cho Admin) */}
        {isAdminUser && (
          <div className="flex p-1 bg-gray-100/80 rounded-xl mb-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterMode === "all"
                  ? "bg-white text-gray-900 shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Tất cả ({stores.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("mine")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                filterMode === "mine"
                  ? "bg-emerald-600 text-white shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Crown size={12} />
              Của tôi ({myStores.length})
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Đang tải cửa hàng...</p>
          </div>
        ) : displayedStores.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            {filterMode === "mine"
              ? "Bạn chưa có vai trò trên cửa hàng nào."
              : "Không tìm thấy cửa hàng nào."}
          </div>
        ) : (
          <div className="space-y-3 max-h-[70vh] scroll-fade overflow-y-auto pr-1">
            {displayedStores.map((store) => {
              const isSelected = selectedStore?.id === store.id;
              const isOwner = isStoreOwner(store);
              const isStaff = isStoreStaff(store);

              return (
                <div
                  key={store.id}
                  onClick={() => onSelectStore(store)}
                  className={`group relative flex flex-col p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-md"
                      : "border-gray-200/80 bg-white hover:border-emerald-500/40 hover:shadow-md"
                  }`}
                >
                  {/* Top Header: Avatar + Title + Badges */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white"
                        }`}
                      >
                        <StoreIcon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {store.name}
                        </h4>

                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {isOwner && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-bold border border-amber-200/60 shadow-xs">
                              <Crown size={10} className="text-amber-600" />
                              Garden Owner
                            </span>
                          )}
                          {isStaff && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold border border-blue-200/60 shadow-xs">
                              <Shield size={10} className="text-blue-600" />
                              Garden Staff
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Status Badge */}
                    {store.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-600/20 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        Đóng cửa
                      </span>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    {store.hotline && (
                      <p className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <span>{store.hotline}</span>
                      </p>
                    )}

                    {store.openingHours && (
                      <p className="flex items-center gap-2">
                        <Clock size={13} className="text-gray-400 shrink-0" />
                        <span>{store.openingHours}</span>
                      </p>
                    )}

                    {/* <p className="flex items-center gap-2 text-gray-500">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span className="line-clamp-1 italic">
                        {store.address || "Chưa cập nhật địa chỉ"}
                      </span>
                    </p> */}
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="flex items-center justify-end gap-1.5 mt-3 pt-2.5 border-t border-gray-100 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStore(store);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 transition-colors border border-emerald-200/50 cursor-pointer"
                      title="Sửa thông tin cửa hàng"
                    >
                      <Edit size={12} />
                      <span>Sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStore(store, false);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200/50 cursor-pointer"
                      title="Tạm dừng / Ngừng bán"
                    >
                      <Trash2 size={12} />
                      <span>Tạm dừng</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStore(store, true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200/50 cursor-pointer"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 size={12} />
                      <span>Xóa Hẳn</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
