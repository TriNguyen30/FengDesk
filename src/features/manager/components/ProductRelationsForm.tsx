import React from "react";
import { Layers, Save, RefreshCw } from "lucide-react";
import type { Category } from "@/features/category/types/category";

interface ProductRelationsFormProps {
  categories: Category[];
  selectedCategoryIds: string[];
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: () => void;
  saving: boolean;
}

export function ProductRelationsForm({
  categories,
  selectedCategoryIds,
  setSelectedCategoryIds,
  onSubmit,
  saving,
}: ProductRelationsFormProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Layers size={18} className="text-primary" />
          <h3 className="text-base font-bold text-gray-950">Danh mục sản phẩm</h3>
        </div>

        {categories.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Đang tải danh mục...</p>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(cat.id)}
                  onChange={() => {
                    setSelectedCategoryIds((prev) =>
                      prev.includes(cat.id)
                        ? prev.filter((id) => id !== cat.id)
                        : [...prev, cat.id],
                    );
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                {cat.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary-dark active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Lưu danh mục
        </button>
      </div>
    </div>
  );
}
