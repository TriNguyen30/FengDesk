import { Store as StoreIcon, RefreshCw, Phone, Clock, Edit, Trash2 } from "lucide-react";
import type { Shop } from "@/features/shop/types/shop";

interface StoreListProps {
  stores: Shop[];
  selectedStore: Shop | null;
  onSelectStore: (store: Shop) => void;
  onEditStore: (store: Shop) => void;
  onDeleteStore: (store: Shop, hard: boolean) => void;
  loading: boolean;
}

export function StoreList({
  stores,
  selectedStore,
  onSelectStore,
  onEditStore,
  onDeleteStore,
  loading,
}: StoreListProps) {
  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
          <StoreIcon size={16} className="text-primary" />
          Danh sách chi nhánh ({stores.length})
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            <p className="text-xs text-gray-400">Đang tải cửa hàng...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Không tìm thấy cửa hàng nào.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
            {stores.map((store) => {
              const isSelected = selectedStore?.id === store.id;
              return (
                <div
                  key={store.id}
                  onClick={() => onSelectStore(store)}
                  className={`group relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 line-clamp-1">{store.name}</h4>
                    {store.isActive ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        Đóng cửa
                      </span>
                    )}
                  </div>

                  {store.hotline && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" />
                      {store.hotline}
                    </p>
                  )}

                  {store.openingHours && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock size={12} className="text-gray-400" />
                      {store.openingHours}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-2 line-clamp-1 italic">
                    {store.address || "Chưa cập nhật địa chỉ"}
                  </p>

                  <div className="flex justify-end gap-2.5 mt-3 pt-2.5 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStore(store);
                      }}
                      className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors"
                      title="Sửa thông tin"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStore(store, false);
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Xóa mềm (Ngừng bán)"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStore(store, true);
                      }}
                      className="p-1 text-red-700 hover:bg-red-100 rounded-md transition-colors text-xs font-semibold px-1"
                      title="Xóa vĩnh viễn"
                    >
                      Hard Del
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
