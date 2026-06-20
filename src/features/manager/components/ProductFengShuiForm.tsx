import React from "react";
import { Sparkles, Save, RefreshCw } from "lucide-react";

interface ProductFengShuiFormProps {
  fsElement: string;
  setFsElement: (val: string) => void;
  fsCompatibility: string;
  setFsCompatibility: (val: string) => void;
  fsDescription: string;
  setFsDescription: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function ProductFengShuiForm({
  fsElement,
  setFsElement,
  fsCompatibility,
  setFsCompatibility,
  fsDescription,
  setFsDescription,
  onSubmit,
  saving,
}: ProductFengShuiFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5"
    >
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Sparkles size={18} className="text-primary" />
        <h2 className="text-base font-bold text-gray-950">Thuộc tính ngũ hành phong thủy</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5 max-w-sm">
          <label className="text-sm font-semibold text-gray-700">Mệnh / Hành phong thủy *</label>
          <select
            value={fsElement}
            onChange={(e) => setFsElement(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
          >
            <option value="Kim">Kim (Kim loại)</option>
            <option value="Mộc">Mộc (Cây cối)</option>
            <option value="Thủy">Thủy (Nước)</option>
            <option value="Hỏa">Hỏa (Lửa)</option>
            <option value="Thổ">Thổ (Đất)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Khả năng tương thích</label>
          <textarea
            rows={3}
            placeholder="Ví dụ: Tương sinh với mệnh Thủy, tương khắc mệnh Hỏa..."
            value={fsCompatibility}
            onChange={(e) => setFsCompatibility(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Mô tả phong thủy</label>
          <textarea
            rows={4}
            placeholder="Ý nghĩa phong thủy, hướng tốt nhất đặt cây..."
            value={fsDescription}
            onChange={(e) => setFsDescription(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary-dark active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Lưu phong thủy
        </button>
      </div>
    </form>
  );
}
