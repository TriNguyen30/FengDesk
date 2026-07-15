import { Leaf } from "lucide-react";
import { useElementInputCodes } from "@/features/products/hooks/useTaxonomy";
import type { ElementInputKind } from "@/features/products/types/taxonomy";

export interface ElementInputValue {
  kind: ElementInputKind;
  code: string;
}

interface ProductElementInputsFieldsProps {
  value: ElementInputValue[];
  onChange: (next: ElementInputValue[]) => void;
}

function toggleInput(
  list: ElementInputValue[],
  kind: ElementInputKind,
  code: string,
): ElementInputValue[] {
  const exists = list.some((i) => i.kind === kind && i.code === code);
  return exists
    ? list.filter((i) => !(i.kind === kind && i.code === code))
    : [...list, { kind, code }];
}

function ChipGroup({
  label,
  codes,
  kind,
  value,
  onChange,
}: {
  label: string;
  codes: string[];
  kind: ElementInputKind;
  value: ElementInputValue[];
  onChange: (next: ElementInputValue[]) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {codes.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Đang tải...</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {codes.map((code) => {
            const active = value.some((i) => i.kind === kind && i.code === code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => onChange(toggleInput(value, kind, code))}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:border-primary/40"
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * "Đặc điểm sản phẩm" — vật liệu/màu/hình khối, chỉ dùng ngôn ngữ mô tả sản phẩm (không nhắc ngũ hành).
 * Nguồn auto-calc vector ngũ hành (tầng 2) khi tạo sản phẩm.
 */
export function ProductElementInputsFields({ value, onChange }: ProductElementInputsFieldsProps) {
  const { materialCodes, colorCodes, shapeCodes } = useElementInputCodes();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Leaf size={18} className="text-primary" />
        <h2 className="text-base font-bold text-gray-950">Đặc điểm sản phẩm</h2>
      </div>
      <ChipGroup
        label="Vật liệu"
        codes={materialCodes}
        kind="Material"
        value={value}
        onChange={onChange}
      />
      <ChipGroup
        label="Màu chủ đạo"
        codes={colorCodes}
        kind="Color"
        value={value}
        onChange={onChange}
      />
      <ChipGroup
        label="Hình khối"
        codes={shapeCodes}
        kind="Shape"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
