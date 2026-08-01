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
const LIQUID_CHAT_KEY = "fd-liquid-chat";

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

function readLiquidChat(): boolean {
  return localStorage.getItem(LIQUID_CHAT_KEY) !== "off";
}

let clouds = readClouds();
let drift = readDrift();
let liquidChat = readLiquidChat();
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

export function getLiquidChat() {
  return liquidChat;
}

export function setLiquidChat(next: boolean) {
  liquidChat = next;

  localStorage.setItem(LIQUID_CHAT_KEY, next ? "on" : "off");
  emit();
}

export function useClouds() {
  return useSyncExternalStore(subscribe, getClouds);
}

/** Nền chất lỏng sau khung hội thoại của trợ lý AI. */
export function useLiquidChat() {
  return useSyncExternalStore(subscribe, getLiquidChat);
}

export function useFluidDrift() {
  return useSyncExternalStore(subscribe, getFluidDrift);
}
