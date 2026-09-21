import type { TooltipProps } from "recharts";
import { elementColor } from "./constants";
import { ElementIcon } from "./RadarTooltipFrame";

// ─────────────────────────── radar dùng chung ───────────────────────────

/** Đẩy icon ra khỏi đỉnh đa giác theo hướng trục — cùng số với radar phòng để hai radar nhìn như một. */
export function elementTickOffset(elementOrLabel: string): { dx: number; dy: number } {
  switch (elementOrLabel) {
    case "Kim":
      return { dx: 0, dy: -10 };
    case "Mộc":
    case "Moc":
      return { dx: 10, dy: -4 };
    case "Thủy":
    case "Thuy":
      return { dx: 10, dy: 4 };
    case "Hỏa":
    case "Hoa":
      return { dx: -10, dy: 4 };
    case "Thổ":
    case "Tho":
      return { dx: -10, dy: -4 };
    default:
      return { dx: 0, dy: 0 };
  }
}

/**
 * Tick của `PolarAngleAxis`: icon hành thay chữ, kèm dấu nhỏ tuỳ chỗ gọi (radar phòng: ↑ thừa / ↓ thiếu;
 * radar bản mệnh: không dấu). Dùng chung để hai radar cùng icon, cùng vị trí, cùng cỡ.
 */
export function makeElementAxisTick(
  labelToElement: Record<string, string>,
  mark?: (element: string) => { text: string; color: string; label: string } | null,
  /** Đổi màu icon theo hành (vd đỏ cho hành nên tránh) — nhẹ hơn một dấu, người xem vẫn nhận ra. */
  colorOf?: (element: string) => string | undefined,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function ElementAxisTick(props: any) {
    const { x, y, payload } = props;
    const element = labelToElement[payload?.value] ?? payload?.value;
    const size = 16;
    const { dx, dy } = elementTickOffset(payload?.value);
    const m = mark?.(element) ?? null;
    return (
      <g transform={`translate(${x + dx - size / 2}, ${y + dy - size / 2})`}>
        <ElementIcon element={element} color={colorOf?.(element) ?? elementColor(element)} size={size} />
        {m && (
          <text x={size + 1} y={5} fontSize={11} fontWeight={700} fill={m.color} aria-label={m.label}>
            {m.text}
          </text>
        )}
      </g>
    );
  };
}

/**
 * Props `Tooltip` của recharts dùng chung cho mọi radar: cho phép thò ra ngoài SVG, không đảo hướng.
 * (Radar phòng còn tự đặt `offset` lệch chuột — recharts nhận `offset` là số, nên bản dùng chung không ép.)
 */
export function radarTooltipProps(): Pick<TooltipProps<number, string>, "reverseDirection" | "allowEscapeViewBox" | "wrapperStyle"> {
  return {
    reverseDirection: { x: false, y: false },
    allowEscapeViewBox: { x: true, y: true },
    wrapperStyle: { overflow: "visible" },
  };
}
