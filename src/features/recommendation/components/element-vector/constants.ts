// Bảng màu/nhãn ngũ hành dùng chung cho mọi atom trong cụm element-vector (nguồn: TURN 5 design).
export const ELEMENT_ORDER = ["Kim", "Moc", "Thuy", "Hoa", "Tho"] as const;

const ELEMENT_VI: Record<string, string> = {
  Kim: "Kim",
  Moc: "Mộc",
  Thuy: "Thủy",
  Hoa: "Hỏa",
  Tho: "Thổ",
};

export const ELEMENT_COLOR: Record<string, string> = {
  Moc: "#6C914A", // sage (brand)
  Thuy: "#3b82f6", // blue
  Hoa: "#ef4444", // red
  Tho: "#D9AD41", // earth gold
  Kim: "#9ca3af", // metal gray
};

// Chỉnh màu chấm radar và nhãn icon tại đây.
// Nếu cần thay đổi màu dot và icon, sửa trực tiếp trong ELEMENT_COLOR.
export const ELEMENT_DOT_COLOR = ELEMENT_COLOR;

export const SURPLUS_COLOR = "#ef4444";
export const SURPLUS_BG = "#fdecea";
export const GAP_THRESHOLD = 0.05;

// Tông màu chip trạng thái "cần bù"/"thừa" (đối lập với "ổn" — chip viền trơn).
export const ATTENTION_BG = "#f6ead8";
export const ATTENTION_TEXT = "#8a6a3f";

export type GapStatus = "deficit" | "surplus" | "balanced";

export function gapStatus(gap: number): GapStatus {
  if (gap > GAP_THRESHOLD) return "deficit";
  if (gap < -GAP_THRESHOLD) return "surplus";
  return "balanced";
}

/** value đã ∈ [0,1] — clamp phòng khi dữ liệu lệch để thanh không tràn. */
export function widthPct(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

export function elementColor(element: string): string {
  return ELEMENT_COLOR[element] ?? "#9ca3af";
}

export function elementVi(element: string): string {
  return ELEMENT_VI[element] ?? element;
}

/** Quy đổi điểm engine v3 [-1,1] → [0,100]% để hiển thị (0 = xung khắc hoàn toàn, 100 = phù hợp tối đa). */
export function scorePercent(score: number): number {
  return Math.round(((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100);
}
