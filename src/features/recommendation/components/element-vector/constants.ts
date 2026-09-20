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

// Đi qua biến CSS để theme tối ánh xạ lại được — cả bốn hằng dưới đây chỉ dùng
// trong style inline của React, nơi CSS không chen vào ghi đè được.
export const SURPLUS_COLOR = "var(--fd-ev-surplus-text)";
export const SURPLUS_BG = "var(--fd-ev-surplus-bg)";
export const GAP_THRESHOLD = 0.05;

// Ngưỡng riêng cho chip ElementTags — khớp ranh giới "Đạt chuẩn" của radar (xem
// hoverStyle trong ElementRadarChart.tsx: distance <= 0.1 = Tối ưu/Đạt chuẩn).
// Nhờ vậy khi hành rơi vào 2 vùng này, chip không còn gắn nhãn "cần bù"/"thừa".
export const TAG_GAP_THRESHOLD = 0.1;

// Tông màu chip trạng thái "cần bù"/"thừa" (đối lập với "ổn" — chip viền trơn).
export const ATTENTION_BG = "var(--fd-ev-attention-bg)";
export const ATTENTION_TEXT = "var(--fd-ev-attention-text)";

export type GapStatus = "deficit" | "surplus" | "balanced";

export function gapStatus(gap: number, threshold: number = GAP_THRESHOLD): GapStatus {
  if (gap > threshold) return "deficit";
  if (gap < -threshold) return "surplus";
  return "balanced";
}

/** value đã ∈ [0,1] — clamp phòng khi dữ liệu lệch để thanh không tràn. */
export function widthPct(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

export function elementColor(element: string): string {
  return ELEMENT_COLOR[element] ?? "#9ca3af";
}

/** Vòng tương khắc — X khắc CONTROLS[X]. Bản sao của `FengShuiCalculator.Controls`, chỉ để tô nhãn, không chấm điểm. */
export const CONTROLS: Record<string, string> = { Moc: "Tho", Tho: "Thuy", Thuy: "Hoa", Hoa: "Kim", Kim: "Moc" };

/** `element` có khắc bản mệnh `destiny` không (quan hệ BiKhac xét từ mệnh). */
export function clashesDestiny(element: string, destiny: string | null | undefined): boolean {
  return !!destiny && CONTROLS[element] === destiny;
}

export function elementVi(element: string): string {
  return ELEMENT_VI[element] ?? element;
}

/** Quy đổi điểm engine v3 [-1,1] → [0,100]% để hiển thị (0 = xung khắc hoàn toàn, 100 = phù hợp tối đa). */
export function scorePercent(score: number): number {
  return Math.round(((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100);
}

/**
 * Thang 5 tông xanh lá → vàng → đỏ của radar "Ngũ hành không gian của bạn" (hoverStyle) — tách ra để
 * chip "Hợp với nghề" ở trang sản phẩm dùng đúng thang đó thay vì chế một bảng màu thứ hai.
 * `border` là màu đậm (viền/chữ), `background` là màu nền mờ (fill).
 */
export interface FitTone {
  background: string;
  border: string;
  label: string;
  /** Tailwind text class cho nhãn tooltip. */
  tone: string;
  /**
   * Viền/chữ cho CHIP (trang sản phẩm): cùng sắc với `border` nhưng trầm xuống ngang tông
   * `border-primary` của chip Phân loại — màu radar tươi để nổi trên nền đồ thị, đem thẳng sang
   * chip cạnh dãy Phân loại thì lạc tông.
   */
  chipBorder: string;
}

export const FIT_TONES: readonly FitTone[] = [
  { background: "rgba(99, 197, 75, 0.18)", border: "#78c539", label: "Tối ưu", tone: "text-emerald-800", chipBorder: "#6C914A" },
  { background: "rgba(152, 204, 56, 0.14)", border: "#9acd3b", label: "Đạt chuẩn", tone: "text-lime-800", chipBorder: "#8a9f4b" },
  { background: "rgba(251, 191, 36, 0.18)", border: "#fbbf24", label: "Ổn định", tone: "text-amber-800", chipBorder: "#b8922e" },
  { background: "rgba(249, 115, 22, 0.18)", border: "#f97316", label: "Cần xem xét", tone: "text-orange-800", chipBorder: "#bf6b2e" },
  { background: "rgba(239, 68, 68, 0.18)", border: "#ef4444", label: "Cần điều chỉnh", tone: "text-red-700", chipBorder: "#b94a47" },
] as const;

/** Radar: theo khoảng cách |current − adjustedIdeal| của một trục. */
export function fitToneByDistance(distance: number): FitTone {
  if (distance <= 0.05) return FIT_TONES[0];
  if (distance <= 0.1) return FIT_TONES[1];
  if (distance <= 0.15) return FIT_TONES[2];
  if (distance <= 0.2) return FIT_TONES[3];
  return FIT_TONES[4];
}

/**
 * Chip % (hợp nghề): theo `displayPercent` ∈ [0,100], 50% = trung tính. Ngưỡng bám tier của
 * `ScoreBadge` (≥80 Rất hợp · ≥60 Phù hợp · ≥40 Trung tính) và chia đôi vùng "Cân nhắc" cho đủ 5 tông.
 */
export function fitToneByPercent(percent: number): FitTone {
  if (percent >= 80) return FIT_TONES[0];
  if (percent >= 60) return FIT_TONES[1];
  if (percent >= 40) return FIT_TONES[2];
  if (percent >= 25) return FIT_TONES[3];
  return FIT_TONES[4];
}

/**
 * Tông của một dòng `cautionFacts`: chỉ chuyện **bản mệnh** (khắc mệnh, hành nên tránh) mới đỏ; mọi
 * lưu ý còn lại (lệch cảm hứng, hành phòng đã thừa, lệch nghề…) là vàng — nhắc nhở, không phải cảnh báo.
 * BE trả câu chữ thuần nên phân loại theo từ khoá; đổi lời ở engine thì rà lại đây.
 */
export type CautionTone = "danger" | "notice";
export function cautionTone(fact: string): CautionTone {
  return /khắc|nên tránh/i.test(fact) ? "danger" : "notice";
}
export const CAUTION_CLASS: Record<CautionTone, string> = {
  danger: "bg-[#fdecea] text-[#b3261e]",
  notice: "bg-[#fdf6e3] text-[#8a6d1f]",
};
