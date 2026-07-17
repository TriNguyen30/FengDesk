import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Nút chuyển theme: default (sage green, nền sáng) ↔ dark (sage green, nền tối).
 * Theme lưu ở localStorage("fd-theme") và gắn qua <html data-theme="...">.
 * Token màu của từng theme khai báo trong src/index.css.
 * (Theme "jade" cũ đã ẩn — giá trị localStorage cũ tự fallback về default.)
 */

const STORAGE_KEY = "fd-theme";
export type ThemeName = "default" | "dark";

let listeners: Array<() => void> = [];

function getTheme(): ThemeName {
  const stored = localStorage.getItem(STORAGE_KEY);
  // Fallback về "default" với giá trị cũ/không hợp lệ (vd: "jade")
  return stored === "dark" ? "dark" : "default";
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

export default function ThemeToggle({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const theme = useSyncExternalStore(subscribe, getTheme);
  const isDark = theme === "dark";

  const toggle = useCallback(() => {
    setTheme(isDark ? "default" : "dark");
  }, [isDark]);

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
      >
        {isDark ? <Moon size={18} /> : <Sun size={18} />}
        <span className="flex-1 text-left">Chế độ tối</span>
        <div
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
            isDark ? "bg-primary" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isDark ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary cursor-pointer"
      aria-label={isDark ? "Đổi về chế độ sáng" : "Đổi sang chế độ tối"}
      title={isDark ? "Chế độ: Tối" : "Chế độ: Sáng"}
    >
      {isDark ? <Moon size={22} strokeWidth={1.8} /> : <Sun size={22} strokeWidth={1.8} />}
      <span className="hidden text-[10px] font-medium sm:block sm:text-xs">
        {isDark ? "Tối" : "Sáng"}
      </span>
    </button>
  );
}
