import { Palette } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Nút chuyển theme màu: default (sage green) ↔ jade (china teal / jade green / gray).
 * Theme lưu ở localStorage("fd-theme") và gắn qua <html data-theme="...">.
 * Token màu của từng theme khai báo trong src/index.css.
 */

const STORAGE_KEY = "fd-theme";
export type ThemeName = "default" | "jade";

let listeners: Array<() => void> = [];

function getTheme(): ThemeName {
  return (localStorage.getItem(STORAGE_KEY) as ThemeName) || "default";
}

/** Gắn theme vào <html>. Gọi 1 lần lúc khởi động app (main.tsx) để không bị nháy màu. */
export function applySavedTheme() {
  const theme = getTheme();
  if (theme === "default") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

function setTheme(theme: ThemeName) {
  localStorage.setItem(STORAGE_KEY, theme);
  applySavedTheme();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme);

  const toggle = useCallback(() => {
    setTheme(theme === "jade" ? "default" : "jade");
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary cursor-pointer"
      aria-label={theme === "jade" ? "Đổi về theme mặc định" : "Đổi sang theme ngọc bích"}
      title={theme === "jade" ? "Theme: Ngọc bích" : "Theme: Mặc định"}
    >
      <Palette size={22} strokeWidth={1.8} />
      <span className="hidden text-[10px] font-medium sm:block sm:text-xs">
        {theme === "jade" ? "Ngọc bích" : "Giao diện"}
      </span>
    </button>
  );
}
