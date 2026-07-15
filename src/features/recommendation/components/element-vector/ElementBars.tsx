import { elementColor, elementVi, widthPct, SURPLUS_BG, SURPLUS_COLOR } from "./constants";

export type BarTone = "positive" | "negative" | "neutral";

export interface ElementBarRow {
  element: string;
  /** thanh nền mờ — mục tiêu/tham chiếu (vd `adjustedIdeal` ở mode space, mức phòng cần ở mode fit). */
  background: number;
  /** thanh đậm — giá trị thực (vd `current` ở mode space, đóng góp sản phẩm ở mode fit). */
  foreground: number;
  tooltip?: string;
  badge?: { label: string; tone: BarTone };
}

interface ElementBarsProps {
  rows: ElementBarRow[];
  /** default: đủ nhãn hành + chip · mini: chỉ dải thanh gọn (workspace card / SpaceTabs). */
  size?: "default" | "mini";
}

/**
 * Atom lõi — dãy 5 thanh đôi (nền mờ = tham chiếu, đậm = giá trị thực). Không biết "space" hay "fit":
 * caller tự map dữ liệu domain của mình vào `background`/`foreground`/`badge`.
 */
export default function ElementBars({ rows, size = "default" }: ElementBarsProps) {
  if (size === "mini") {
    return (
      <div className="flex flex-1 items-center gap-1">
        {rows.map((row) => (
          <div
            key={row.element}
            className="relative h-1.5 w-6 shrink-0 overflow-hidden rounded-full bg-gray-200"
            title={row.tooltip}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: widthPct(row.foreground),
                backgroundColor: elementColor(row.element),
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.element} className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-sm font-medium text-[#111827]">
            {elementVi(row.element)}
          </span>
          <div
            className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100"
            title={row.tooltip}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: widthPct(row.background),
                backgroundColor: elementColor(row.element),
                opacity: 0.25,
              }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: widthPct(row.foreground),
                backgroundColor: elementColor(row.element),
              }}
            />
          </div>
          {row.badge && (
            <BarBadge
              label={row.badge.label}
              tone={row.badge.tone}
              color={elementColor(row.element)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function BarBadge({ label, tone, color }: { label: string; tone: BarTone; color: string }) {
  if (tone === "positive") {
    return (
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ backgroundColor: `${color}26`, color }}
      >
        {label}
      </span>
    );
  }
  if (tone === "negative") {
    return (
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ backgroundColor: SURPLUS_BG, color: SURPLUS_COLOR }}
      >
        {label}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
      {label}
    </span>
  );
}
