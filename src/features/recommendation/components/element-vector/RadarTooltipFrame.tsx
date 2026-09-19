import type { ReactNode } from "react";
import { Circle, Droplets, Flame, Leaf, Mountain } from "lucide-react";
import { elementColor, elementVi, type FitTone } from "./constants";

/** Icon của hành — dùng chung cho legend radar, tooltip, chip. Nhận cả mã (`Moc`) lẫn tên có dấu (`Mộc`). */
export function ElementIcon({ element, color, size = 18 }: { element: string; color?: string; size?: number }) {
  const stroke = color ?? elementColor(element);
  const common = { size, strokeWidth: 1.5, fill: "none", stroke };
  switch (element) {
    case "Mộc":
    case "Moc":
      return <Leaf {...common} />;
    case "Thủy":
    case "Thuy":
      return <Droplets {...common} />;
    case "Hỏa":
    case "Hoa":
      return <Flame {...common} />;
    case "Thổ":
    case "Tho":
      return <Mountain {...common} />;
    default:
      return <Circle {...common} />;
  }
}

interface RadarTooltipFrameProps {
  element: string;
  /** Tông 5 mức (constants.FIT_TONES) — quyết định nền, viền và màu chữ nhãn. */
  tone: FitTone;
  /** Nhãn trong pill; mặc định dùng nhãn của tông ("Tối ưu", "Cần điều chỉnh"…). */
  pillLabel?: string;
  /** Nhãn nhỏ góc phải tiêu đề, vd "khắc mệnh". */
  badge?: ReactNode;
  width?: number;
  children: ReactNode;
}

/**
 * Khung tooltip dùng chung cho MỌI radar (phòng, bản mệnh) và popover chip nghề: viền + nền theo tông,
 * tiêu đề có icon hành, một pill nhãn mức, rồi thân do từng chỗ tự điền. Cùng một khung để user học
 * cách đọc một lần — đổi màn hình vẫn nhận ra "đây là tooltip giải thích".
 */
export function RadarTooltipFrame({ element, tone, pillLabel, badge, width = 180, children }: RadarTooltipFrameProps) {
  const color = elementColor(element);
  return (
    <div
      className="rounded-xl border p-3 text-xs shadow-lg backdrop-blur-[3px]"
      style={{ width, background: tone.background, borderColor: tone.border }}
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="inline-flex items-center justify-center rounded-full bg-white p-1 shadow-sm">
          <ElementIcon element={element} color={color} />
        </span>
        <span className="min-w-0 flex-1 truncate">{elementVi(element)}</span>
        {badge && <span className="shrink-0 text-[10px] font-medium">{badge}</span>}
      </div>
      <div className="rounded-full bg-black/5 px-3 py-1.5 text-[11px] font-medium text-slate-700">
        <span className={tone.tone}>{pillLabel ?? tone.label}</span>
      </div>
      <div className="mt-3 space-y-2 text-slate-700">{children}</div>
    </div>
  );
}

/** Một dòng "nhãn … giá trị" trong thân tooltip. */
export function TooltipRow({
  label,
  value,
  strong = false,
  muted = false,
}: {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 text-[11px] ${
        strong ? "font-semibold text-slate-900" : muted ? "text-slate-500" : ""
      }`}
    >
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}
