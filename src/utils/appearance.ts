import { useSyncExternalStore } from "react";

/**
 * Cài đặt hiệu ứng giao diện.
 *
 * Dùng store ngoài React theo đúng kiểu ThemeToggle: giá trị cache ở module, ghi
 * xuống localStorage khi đổi, mọi component đọc qua useSyncExternalStore nên
 * panel cài đặt và các lớp hiệu ứng luôn khớp nhau.
 *
 * Toàn bộ phần "hiệu ứng nền" nằm trong MỘT object `EffectSettings` và được lưu
 * dưới một khoá JSON duy nhất. Ba preset (Đầy đủ / Vừa / Tắt) chỉ là ba object
 * dựng sẵn; "Tùy chỉnh" KHÔNG phải giá trị lưu được mà là trạng thái dẫn xuất —
 * cài đặt hiện tại không khớp preset nào thì tự khắc là tùy chỉnh.
 */

const EFFECTS_KEY = "fd-effects";
const CHAT_SURFACE_KEY = "fd-chat-surface";
/** Các khoá rời của bản trước — chỉ còn dùng để chuyển đổi dữ liệu cũ một lần. */
const LEGACY_CLOUDS_KEY = "fd-clouds";
const LEGACY_DRIFT_KEY = "fd-fluid-drift";
const LEGACY_LIQUID_CHAT_KEY = "fd-liquid-chat";

// ── Chất liệu nền khung chat AI ──────────────────────────────────────────────
// CỐ Ý tách khỏi EffectSettings: đây là cài đặt của khung hội thoại chứ không
// phải hiệu ứng nền trang, nên đổi preset không được phép động vào nó.

/**
 * Bản trước có thêm chế độ "liquid" (mặt nước WebGL). Đã gỡ vì hiệu năng: mỗi
 * khung hình nó phải drawImage lại lớp ASCII rồi upload thành texture — một
 * vòng GPU → CPU → GPU chạy suốt thời gian khung chat mở.
 */
export type ChatSurface = "blur" | "off";

export const CHAT_SURFACES: ReadonlyArray<{ value: ChatSurface; label: string }> = [
  { value: "blur", label: "Mờ" },
  { value: "off", label: "Tắt" },
];

// ── Hiệu ứng nền ─────────────────────────────────────────────────────────────

/** Mảng mây: chạy / đứng im / ẩn hẳn. */
export type CloudMode = "playing" | "paused" | "hidden";

/**
 * Chất liệu dải nội dung (.fd-rail).
 *
 * - `blur`  — `backdrop-filter: blur()`. Đẹp nhất và ĐẮT NHẤT: nó khiến việc vẽ
 *   rail phụ thuộc vào các lớp đang động phía sau, nên mỗi khung hình canvas đổi
 *   là một lượt blur gaussian gần kín màn hình.
 * - `tint`  — đục màu bán trong suốt. Rail thành layer TĨNH, trình duyệt cache
 *   lại và không raster lần nào nữa. Mây vẫn hiện mờ mờ xuyên qua.
 *
 * Không có lựa chọn "không dải": bỏ hẳn thì chữ nằm thẳng trên mây đang trôi,
 * tương phản tụt xuống dưới ngưỡng đọc được ở những chỗ mảng mây chồng nhau. Mà
 * `tint` vốn đã gần như miễn phí nên cũng chẳng có gì để tiết kiệm thêm.
 */
export type RailSurface = "blur" | "tint";

/**
 * Quan hệ giữa lớp fluid và dải nội dung.
 *
 * - `full`   — vẽ khắp màn hình. Mặc định, không đổi gì so với trước.
 * - `clip`   — vẫn MÔ PHỎNG toàn lưới nhưng không vẽ phần bị dải che, và thu
 *   clearRect về hai dải lề. Sóng hành xử y hệt `full`, chỉ rẻ hơn. Hợp lý khi
 *   railSurface là `tint` (dải đục màu che gần hết phần đó rồi).
 * - `stitch` — bỏ hẳn phần giữa khỏi lưới, nối cột cuối lề trái với cột đầu lề
 *   phải. Lưới còn ~1/3 nên `step()` rẻ đi 3 lần, ĐỔI LẠI sóng hất vào mép trái
 *   sẽ bật ra ở mép phải ngay lập tức — cách nhau cả chiều rộng dải trên màn.
 *   Để thử nghiệm; nhìn kỹ sẽ thấy "teleport".
 */
export type FluidRail = "full" | "clip" | "stitch";

export interface EffectSettings {
  /**
   * Khung hình/giây của lớp fluid ASCII. 0 = ngừng bơm mực; phần mực đang có tan
   * dần rồi vòng lặp tự ngủ, không đóng băng lại thành một vũng ký tự đứng im.
   */
  fluidFps: number;
  /** Cường độ cụm fluid trôi nổi ngẫu nhiên, 0..FLUID_DRIFT_MAX. */
  fluidDrift: number;
  fluidRail: FluidRail;
  cloudMode: CloudMode;
  railSurface: RailSurface;
  /** Hạt bay + vầng sáng xoay khi rê chuột vào thẻ ngũ hành ở trang chủ. */
  hoverEffects: boolean;
  /** Chuyển cảnh giữa các trang (framer-motion ở AppLayout). */
  pageTransition: boolean;
}

/** Thang cường độ fluid trôi nổi ngẫu nhiên: 0 = tắt hẳn. */
export const FLUID_DRIFT_MAX = 5;

/**
 * Các mốc FPS cho thanh trượt.
 *
 * CỐ Ý không có 24: trên màn 60Hz thì 60/24 = 2,5 — không chia hết, nên nhịp
 * khung hình đều-lệch-đều và mắt thấy giật hơn cả 20fps. 30 (đúng 1 khung trên
 * 2) mượt hơn hẳn mà rẻ tương đương.
 */
export const FPS_STEPS = [0, 15, 20, 30, 60] as const;

export type EffectPreset = "full" | "medium" | "off";

export const EFFECT_PRESETS: Record<EffectPreset, EffectSettings> = {
  full: {
    fluidFps: 60,
    fluidDrift: 3,
    fluidRail: "full",
    cloudMode: "playing",
    railSurface: "blur",
    hoverEffects: true,
    pageTransition: true,
  },
  medium: {
    fluidFps: 30,
    fluidDrift: 3,
    // Dải đục màu đã che gần hết phần fluid nằm sau nó, nên bỏ vẽ chỗ đó là
    // tiết kiệm gần như miễn phí — sóng vẫn hành xử y hệt.
    fluidRail: "clip",
    cloudMode: "playing",
    railSurface: "tint",
    hoverEffects: true,
    pageTransition: true,
  },
  // "Tắt" chỉ tắt phần TRANG TRÍ. Phản hồi chức năng (spinner đang tải, tiến
  // trình, trạng thái nút) không nằm ở đây và không bao giờ bị tắt — người dùng
  // vẫn phải biết hệ thống đang làm gì.
  off: {
    fluidFps: 0,
    fluidDrift: 0,
    fluidRail: "full",
    cloudMode: "paused",
    // `tint` chứ không phải "bỏ dải": nó đã là layer tĩnh nên chi phí đúng bằng
    // 0, mà vẫn giữ được nền đọc chữ. Không có gì để tiết kiệm thêm ở đây.
    railSurface: "tint",
    hoverEffects: false,
    pageTransition: false,
  },
};

export const EFFECT_PRESET_LABELS: ReadonlyArray<{ value: EffectPreset; label: string }> = [
  { value: "full", label: "Đầy đủ" },
  { value: "medium", label: "Vừa" },
  { value: "off", label: "Tắt" },
];

const EFFECTS_DEFAULT = EFFECT_PRESETS.full;
const CHAT_SURFACE_DEFAULT: ChatSurface = "off";

// ── Đọc / ghi ────────────────────────────────────────────────────────────────

/**
 * Số nguyên trong [0, max], hoặc null nếu không đọc được.
 *
 * Phải loại null/undefined/"" TRƯỚC khi ép kiểu: `Number(null)` là 0 chứ không
 * phải NaN, nên nếu chỉ dựa vào Number.isFinite thì một khoá localStorage KHÔNG
 * TỒN TẠI sẽ đọc ra 0 — và 0 là giá trị hợp lệ (= tắt), nên nó âm thầm ghi đè
 * mặc định thay vì bị bỏ qua.
 */
function clampInt(value: unknown, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;

  const n = Math.round(Number(value));

  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

/** "none" là giá trị của bản trước — lựa chọn đó không còn, quy về "tint". */
function readRailSurface(value: unknown): RailSurface {
  if (value === "blur" || value === "tint") return value;
  if (value === "none") return "tint";

  return EFFECTS_DEFAULT.railSurface;
}

/**
 * Nhận dữ liệu cũ (các khoá rời của bản trước) vào object mới.
 * Chỉ chạy khi chưa có khoá `fd-effects`, tức đúng một lần cho mỗi trình duyệt.
 */
function migrateLegacy(): Partial<EffectSettings> {
  const legacy: Partial<EffectSettings> = {};

  if (localStorage.getItem(LEGACY_CLOUDS_KEY) === "off") legacy.cloudMode = "hidden";

  const drift = clampInt(localStorage.getItem(LEGACY_DRIFT_KEY), FLUID_DRIFT_MAX);

  if (drift !== null) legacy.fluidDrift = drift;

  return legacy;
}

function readEffects(): EffectSettings {
  const raw = localStorage.getItem(EFFECTS_KEY);

  if (raw === null) return { ...EFFECTS_DEFAULT, ...migrateLegacy() };

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return EFFECTS_DEFAULT;
  }

  if (typeof parsed !== "object" || parsed === null) return EFFECTS_DEFAULT;

  // Từng trường một: dữ liệu cũ có thể thiếu trường mới thêm, và giá trị hỏng
  // thì rơi về mặc định thay vì kéo cả app xuống theo.
  const value = parsed as Record<string, unknown>;
  const fluidFps = clampInt(value.fluidFps, 60);
  const fluidDrift = clampInt(value.fluidDrift, FLUID_DRIFT_MAX);

  return {
    fluidFps: fluidFps ?? EFFECTS_DEFAULT.fluidFps,
    fluidDrift: fluidDrift ?? EFFECTS_DEFAULT.fluidDrift,
    fluidRail:
      value.fluidRail === "full" || value.fluidRail === "clip" || value.fluidRail === "stitch"
        ? value.fluidRail
        : EFFECTS_DEFAULT.fluidRail,
    cloudMode:
      value.cloudMode === "playing" || value.cloudMode === "paused" || value.cloudMode === "hidden"
        ? value.cloudMode
        : EFFECTS_DEFAULT.cloudMode,
    railSurface: readRailSurface(value.railSurface),
    hoverEffects:
      typeof value.hoverEffects === "boolean" ? value.hoverEffects : EFFECTS_DEFAULT.hoverEffects,
    pageTransition:
      typeof value.pageTransition === "boolean"
        ? value.pageTransition
        : EFFECTS_DEFAULT.pageTransition,
  };
}

function readChatSurface(): ChatSurface {
  const raw = localStorage.getItem(CHAT_SURFACE_KEY);

  // "liquid" là giá trị của bản trước — chế độ đó không còn, rơi về "blur".
  if (raw === "liquid") return "blur";
  if (raw === "blur" || raw === "off") return raw;

  // Ai từng chủ động TẮT bằng công tắc boolean của bản trước thì giữ nguyên ý đó.
  return localStorage.getItem(LEGACY_LIQUID_CHAT_KEY) === "off" ? "off" : CHAT_SURFACE_DEFAULT;
}

let effects = readEffects();
let chatSurface = readChatSurface();
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);

  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

// ── API ──────────────────────────────────────────────────────────────────────

export function getEffects() {
  return effects;
}

/**
 * Sửa một phần cài đặt. Trả object MỚI chứ không vá tại chỗ — useSyncExternalStore
 * so sánh bằng tham chiếu, vá tại chỗ thì không component nào nhận ra là đã đổi.
 */
export function setEffects(patch: Partial<EffectSettings>) {
  effects = { ...effects, ...patch };

  localStorage.setItem(EFFECTS_KEY, JSON.stringify(effects));
  emit();
}

export function applyEffectPreset(preset: EffectPreset) {
  setEffects(EFFECT_PRESETS[preset]);
}

/**
 * Preset khớp với cài đặt hiện tại, hoặc null nếu không khớp cái nào ("Tùy chỉnh").
 * Dẫn xuất chứ không lưu — chỉnh tay một thứ bất kỳ là tự rơi về null.
 */
export function getActivePreset(current: EffectSettings): EffectPreset | null {
  const keys = Object.keys(EFFECTS_DEFAULT) as Array<keyof EffectSettings>;

  for (const [name, preset] of Object.entries(EFFECT_PRESETS)) {
    if (keys.every((key) => current[key] === preset[key])) return name as EffectPreset;
  }

  return null;
}

export function getChatSurface() {
  return chatSurface;
}

export function setChatSurface(next: ChatSurface) {
  chatSurface = next;

  localStorage.setItem(CHAT_SURFACE_KEY, next);
  emit();
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useEffectSettings() {
  return useSyncExternalStore(subscribe, getEffects);
}

/** Chất liệu nền sau khung hội thoại của trợ lý AI. */
export function useChatSurface() {
  return useSyncExternalStore(subscribe, getChatSurface);
}
