import { useEffect, useRef } from "react";
import { useSkuSuggestion } from "../hooks/useSkuSuggestion";

interface SkuInputProps {
  value: string;
  onChange: (sku: string) => void;
  /** Sửa biến thể đã có mã: không điền đè mã cũ (SKU phải bất biến — docs/adr/platform-sku-generation.md). */
  suggest?: boolean;
  className?: string;
}

/**
 * Ô SKU: điền sẵn MỘT LẦN mã do sàn sinh (`FD-XXXXXXXX`, chưa dùng); muốn đổi thì người bán xoá đi gõ mã riêng.
 * Xoá trống cũng được — BE tự sinh lúc lưu. Không sinh mã theo tên ở FE: tên gần giống nhau ra cùng mã và FE
 * không kiểm trùng được.
 */
export function SkuInput({ value, onChange, suggest = true, className = "" }: SkuInputProps) {
  const { suggestion } = useSkuSuggestion(suggest);
  const filled = useRef(false);

  useEffect(() => {
    // Chỉ điền khi ô còn trống lúc mã về — người bán đã kịp gõ thì không đè.
    if (!suggestion || filled.current) return;
    filled.current = true;
    if (value === "") onChange(suggestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi mã gợi ý về
  }, [suggestion]);

  return (
    <input
      type="text"
      maxLength={20}
      placeholder="Để trống — hệ thống tự sinh"
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      className={`w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 ${className}`}
      data-testid="sku-input"
    />
  );
}
