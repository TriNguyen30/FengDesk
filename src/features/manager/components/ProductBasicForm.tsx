import React from "react";
import { Info, Save, RefreshCw } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

interface ProductBasicFormProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  storeName?: string;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function ProductBasicForm({
  name,
  setName,
  description,
  setDescription,
  isActive,
  setIsActive,
  storeName,
  onSubmit,
  saving,
}: ProductBasicFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5"
    >
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Info size={18} className="text-primary" />
        <h2 className="text-base font-bold text-gray-950">Chỉnh sửa thông tin cơ bản</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-semibold text-gray-700">Tên sản phẩm *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Cửa hàng vườn</label>
          <div className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 font-medium select-none">
            {storeName || "Chưa cập nhật"}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Trạng thái bán</label>
          <div className="flex h-[42px] items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {isActive ? "Đang bán" : "Ngừng bán"}
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-semibold text-gray-700">Mô tả sản phẩm</label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Nhập mô tả chi tiết về sản phẩm này..."
            minHeight="150px"
          />
        </div>
      </div>

      <div className="flex justify-end pt-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-dark active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
}
