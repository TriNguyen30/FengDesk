import React from "react";
import { Sparkles, Save, RefreshCw } from "lucide-react";
import type { LookupItem } from "@/features/products/types/taxonomy";

export const FS_ELEMENTS = [
  { code: "Kim", label: "Kim (Kim loại)" },
  { code: "Moc", label: "Mộc (Cây cối)" },
  { code: "Thuy", label: "Thủy (Nước)" },
  { code: "Hoa", label: "Hỏa (Lửa)" },
  { code: "Tho", label: "Thổ (Đất)" },
];

export const FS_SIZE_CLASSES = [
  { code: "Small", label: "Nhỏ" },
  { code: "Medium", label: "Vừa" },
  { code: "Large", label: "Lớn" },
];

export interface FengShuiValues {
  primaryElement: string;
  secondaryElements: string[];
  sizeClass: string;
  vibes: string[];
  styles: string[];
}

interface ProductFengShuiFieldsProps {
  value: FengShuiValues;
  onChange: (next: FengShuiValues) => void;
  vibeOptions: LookupItem[];
  styleOptions: LookupItem[];
}

function toggle(list: string[], code: string): string[] {
  return list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
}

interface ElementSelectFieldsProps {
  value: Pick<FengShuiValues, "primaryElement" | "secondaryElements">;
  onChange: (next: Pick<FengShuiValues, "primaryElement" | "secondaryElements">) => void;
}

/** Hành chính/phụ — đường advanced/fallback (tầng 3), tách riêng để đặt trong khu "Phong thủy nâng cao". */
export function ProductElementSelectFields({ value, onChange }: ElementSelectFieldsProps) {
  const set = (patch: Partial<ElementSelectFieldsProps["value"]>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-5">
      {/* Hành chính */}
      <div className="space-y-1.5 max-w-sm">
        <label className="text-sm font-semibold text-gray-700">Hành chính (mệnh) *</label>
        <select
          value={value.primaryElement}
          onChange={(e) =>
            set({
              primaryElement: e.target.value,
              secondaryElements: value.secondaryElements.filter((c) => c !== e.target.value),
            })
          }
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
        >
          <option value="">-- Không chọn (dùng Đặc điểm sản phẩm) --</option>
          {FS_ELEMENTS.map((el) => (
            <option key={el.code} value={el.code}>
              {el.label}
            </option>
          ))}
        </select>
      </div>

      {/* Hành phụ */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Hành phụ (tùy chọn)</label>
        <div className="flex flex-wrap gap-2">
          {FS_ELEMENTS.filter((el) => el.code !== value.primaryElement).map((el) => {
            const active = value.secondaryElements.includes(el.code);
            return (
              <button
                key={el.code}
                type="button"
                onClick={() => set({ secondaryElements: toggle(value.secondaryElements, el.code) })}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:border-primary/40"
                }`}
              >
                {el.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface VibeStyleFieldsProps {
  value: Pick<FengShuiValues, "sizeClass" | "vibes" | "styles">;
  onChange: (next: Pick<FengShuiValues, "sizeClass" | "vibes" | "styles">) => void;
  vibeOptions: LookupItem[];
  styleOptions: LookupItem[];
}

/** Kích thước / vibe / style — độc lập với phong thủy nâng cao, luôn hiện. */
export function ProductVibeStyleFields({
  value,
  onChange,
  vibeOptions,
  styleOptions,
}: VibeStyleFieldsProps) {
  const set = (patch: Partial<VibeStyleFieldsProps["value"]>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-5">
      {/* Kích thước */}
      <div className="space-y-1.5 max-w-sm">
        <label className="text-sm font-semibold text-gray-700">Phân loại kích thước</label>
        <select
          value={value.sizeClass}
          onChange={(e) => set({ sizeClass: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
        >
          {FS_SIZE_CLASSES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Vibe */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Cảm hứng không gian (vibe)</label>
        {vibeOptions.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Đang tải vibe...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {vibeOptions.map((v) => {
              const active = value.vibes.includes(v.code);
              return (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => set({ vibes: toggle(value.vibes, v.code) })}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-primary/40"
                  }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Phong cách (style)</label>
        {styleOptions.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Đang tải style...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((s) => {
              const active = value.styles.includes(s.code);
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => set({ styles: toggle(value.styles, s.code) })}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-primary/40"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Toàn bộ trường thuộc tính phong thủy (hành + kích thước + vibe/style) gộp lại — dùng ở tab
 * Edit (1 form, 1 nút lưu duy nhất gọi PUT /feng-shui). Ở Create, 2 khối trên được tách ra
 * đặt ở 2 vị trí khác nhau trong trang thay vì gộp qua component này.
 */
export function ProductFengShuiFields({
  value,
  onChange,
  vibeOptions,
  styleOptions,
}: ProductFengShuiFieldsProps) {
  return (
    <div className="space-y-5">
      <ProductElementSelectFields value={value} onChange={(patch) => onChange({ ...value, ...patch })} />
      <ProductVibeStyleFields
        value={value}
        onChange={(patch) => onChange({ ...value, ...patch })}
        vibeOptions={vibeOptions}
        styleOptions={styleOptions}
      />
    </div>
  );
}

interface ProductFengShuiFormProps extends ProductFengShuiFieldsProps {
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

/** Tab phong thủy ở trang Edit — fields + nút lưu (gọi PUT /products/{id}/feng-shui). */
export function ProductFengShuiForm({ onSubmit, saving, ...fields }: ProductFengShuiFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5"
    >
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Sparkles size={18} className="text-primary" />
        <h2 className="text-base font-bold text-gray-950">Thuộc tính phong thủy</h2>
      </div>

      <ProductFengShuiFields {...fields} />

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
