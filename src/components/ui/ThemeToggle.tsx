import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "fd-theme";

export type ThemeName = "default" | "dark";

let listeners: Array<() => void> = [];

function getTheme(): ThemeName {
  const stored = localStorage.getItem(STORAGE_KEY);

  return stored === "dark" || stored === "default" ? stored : "default";
}

export function applySavedTheme() {
  const theme = getTheme();

  document.documentElement.setAttribute("data-theme", theme);
}

function setTheme(theme: ThemeName) {
  localStorage.setItem(STORAGE_KEY, theme);

  applySavedTheme();

  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.push(listener);

  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

export default function ThemeToggle({
  variant = "default",
}: {
  variant?: "default" | "sidebar";
}) {
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
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-neutral-dark hover:text-text-primary"
      >
        {isDark ? <Moon size={18} /> : <Sun size={18} />}

        <span className="flex-1 text-left">
          {isDark ? "Chế độ tối" : "Chế độ sáng"}
        </span>

        <div
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${isDark ? "bg-primary" : "bg-neutral-dark"
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${isDark ? "translate-x-4.5" : "translate-x-0.5"
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
      className="flex min-w-[44px] cursor-pointer flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-text-primary transition-colors hover:text-primary"
      aria-label={isDark ? "Đổi về chế độ sáng" : "Đổi sang chế độ tối"}
      title={isDark ? "Chế độ: Tối" : "Chế độ: default"}
    >
      {isDark ? (
        <Moon size={22} strokeWidth={1.8} />
      ) : (
        <Sun size={22} strokeWidth={1.8} />
      )}

      <span className="hidden text-[10px] font-medium sm:block sm:text-xs">
        {isDark ? "Tối" : "default"}
      </span>
    </button>
  );
}