// Bảng màu/nhãn ngũ hành dùng chung cho mọi atom trong cụm element-vector (nguồn: TURN 5 design).
export const ELEMENT_ORDER = ["Kim", "Moc", "Thuy", "Hoa", "Tho"] as const;

const ELEMENT_VI: Record<string, string> = {
  Kim: "Kim",
  Moc: "Mộc",
  Thuy: "Thủy",
  Hoa: "Hỏa",
  Tho: "Thổ",
};

const ELEMENT_COLOR: Record<string, string> = {
  Moc: "#7d8f69", // sage (brand)
  Thuy: "#3b82f6", // blue
  Hoa: "#ef4444", // red
  Tho: "#c4a86a", // earth gold
  Kim: "#9ca3af", // metal gray
};

export const SURPLUS_COLOR = "#ef4444";
export const SURPLUS_BG = "#fdecea";
export const GAP_THRESHOLD = 0.05;

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
