import { useSyncExternalStore } from "react";

/**
 * Cài đặt giao diện nền (mảng mây + cường độ fluid trôi nổi).
 *
 * Dùng store ngoài React theo đúng kiểu ThemeToggle: giá trị cache ở module,
 * ghi xuống localStorage khi đổi, mọi component đọc qua useSyncExternalStore
 * nên panel cài đặt trong Hồ sơ và lớp nền luôn khớp nhau.
 */

const CLOUDS_KEY = "fd-clouds";
const DRIFT_KEY = "fd-fluid-drift";
const CHAT_SURFACE_KEY = "fd-chat-surface";
/** Khoá bật/tắt kiểu boolean của bản trước — chỉ còn dùng để chuyển đổi dữ liệu cũ. */
const LEGACY_LIQUID_CHAT_KEY = "fd-liquid-chat";

/**
 * Chất liệu nền khung hội thoại của trợ lý AI.
 *
 * Bản trước có thêm chế độ "liquid" (mặt nước WebGL). Đã gỡ vì lý do hiệu năng:
 * mỗi khung hình nó phải drawImage lại lớp ASCII rồi upload thành texture —
 * một vòng GPU → CPU → GPU chạy suốt thời gian khung chat mở. Ai đang chọn
 * "liquid" sẽ được chuyển sang "blur" ở readChatSurface().
 */
export type ChatSurface = "blur" | "off";

export const CHAT_SURFACES: ReadonlyArray<{ value: ChatSurface; label: string }> = [
  { value: "blur", label: "Mờ" },
  { value: "off", label: "Tắt" },
];

/** Thang cường độ fluid trôi nổi ngẫu nhiên: 0 = tắt hẳn. */
export const FLUID_DRIFT_MAX = 5;
const FLUID_DRIFT_DEFAULT = 2;

function readClouds(): boolean {
  return localStorage.getItem(CLOUDS_KEY) !== "off";
}

function readDrift(): number {
  const raw = localStorage.getItem(DRIFT_KEY);

  if (raw === null) return FLUID_DRIFT_DEFAULT;

  const value = Math.round(Number(raw));

  return Number.isFinite(value) && value >= 0 && value <= FLUID_DRIFT_MAX
    ? value
    : FLUID_DRIFT_DEFAULT;
}

const CHAT_SURFACE_DEFAULT: ChatSurface = "blur";

function readChatSurface(): ChatSurface {
  const raw = localStorage.getItem(CHAT_SURFACE_KEY);

  // "liquid" là giá trị của bản trước — chế độ đó không còn, rơi về "blur".
  if (raw === "liquid") return "blur";
  if (raw === "blur" || raw === "off") return raw;

  // Ai từng chủ động TẮT bằng công tắc boolean của bản trước thì giữ nguyên ý đó;
  // còn lại coi như chưa chọn gì và rơi về mặc định mới.
  return localStorage.getItem(LEGACY_LIQUID_CHAT_KEY) === "off" ? "off" : CHAT_SURFACE_DEFAULT;
}

let clouds = readClouds();
let drift = readDrift();
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

export function getClouds() {
  return clouds;
}

export function setClouds(next: boolean) {
  clouds = next;

  localStorage.setItem(CLOUDS_KEY, next ? "on" : "off");
  emit();
}

export function getFluidDrift() {
  return drift;
}

export function setFluidDrift(next: number) {
  drift = Math.min(FLUID_DRIFT_MAX, Math.max(0, Math.round(next)));

  localStorage.setItem(DRIFT_KEY, String(drift));
  emit();
}

export function getChatSurface() {
  return chatSurface;
}

export function setChatSurface(next: ChatSurface) {
  chatSurface = next;

  localStorage.setItem(CHAT_SURFACE_KEY, next);
  emit();
}

export function useClouds() {
  return useSyncExternalStore(subscribe, getClouds);
}

/** Chất liệu nền sau khung hội thoại của trợ lý AI. */
export function useChatSurface() {
  return useSyncExternalStore(subscribe, getChatSurface);
}

export function useFluidDrift() {
  return useSyncExternalStore(subscribe, getFluidDrift);
}
