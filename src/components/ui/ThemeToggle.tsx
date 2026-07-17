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

export default function ThemeToggle({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const theme = useSyncExternalStore(subscribe, getTheme);

  const toggle = useCallback(() => {
    setTheme(theme === "jade" ? "default" : "jade");
  }, [theme]);

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
      >
        <Palette size={18} />
        <span className="flex-1 text-left">Giao diện</span>
        <div
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
            theme === "jade" ? "bg-primary" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              theme === "jade" ? "translate-x-4.5" : "translate-x-0.5"
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
