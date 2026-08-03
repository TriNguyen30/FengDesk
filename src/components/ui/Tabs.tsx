import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Thanh tab dùng chung + khối nội dung có chuyển cảnh.
 *
 * Dự án có HAI loại tab, đừng gộp làm một:
 *  - **Filter tab** (đơn hàng, giao hàng, hàng trả…): tab chỉ đổi bộ lọc trên CÙNG một danh sách.
 *    Chỉ dùng `<Tabs>`. KHÔNG bọc danh sách trong `<TabPanel>` — mỗi lần lọc mà nháy cả danh sách
 *    thì khó chịu hơn là không có animation.
 *  - **Panel tab** (trang cửa hàng: sản phẩm / thống kê / giao hàng): mỗi tab là nội dung khác hẳn.
 *    Dùng `<Tabs>` + `<TabPanel>`.
 *
 * Chỉ báo tab đang chọn trượt bằng `layoutId` của framer-motion — thuần transform nên compositor lo,
 * không gây layout. Tôn trọng `prefers-reduced-motion`.
 */

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: LucideIcon;
  /** Badge số lượng. Theo hành vi sẵn có: chỉ hiện khi tab KHÔNG được chọn, và > 0. */
  count?: number;
  hidden?: boolean;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `pill` = nút bo tròn nền primary (trang quản lý). `underline` = gạch chân (trang cửa hàng). */
  variant?: "pill" | "underline";
  className?: string;
  ariaLabel?: string;
}

const VARIANTS = {
  pill: {
    list: "flex flex-wrap gap-1.5",
    button:
      "relative rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors",
    active: "text-white",
    idle: "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
    indicator: "absolute inset-0 rounded-lg bg-primary shadow-sm",
  },
  underline: {
    list: "flex flex-wrap gap-1.5 border-b border-gray-100",
    button:
      "relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors",
    active: "text-primary",
    idle: "text-gray-500 hover:text-gray-800",
    indicator: "absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary",
  },
} as const;

export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = "pill",
  className = "",
  ariaLabel,
}: TabsProps<T>) {
  const reduceMotion = useReducedMotion();
  // Mỗi thanh tab một layoutId riêng — hai thanh trên cùng trang mà trùng id thì chỉ báo sẽ bay qua lại giữa chúng.
  const layoutId = useId();
  const style = VARIANTS[variant];

  return (
    <div className={`${style.list} ${className}`} role="tablist" aria-label={ariaLabel}>
      {items
        .filter((tab) => !tab.hidden)
        .map((tab) => {
          const Icon = tab.icon;
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={`${style.button} ${active ? style.active : style.idle}`}
            >
              {active &&
                (reduceMotion ? (
                  <span className={style.indicator} />
                ) : (
                  <motion.span
                    layoutId={layoutId}
                    className={style.indicator}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ))}
              {/* Nội dung phải nằm TRÊN chỉ báo. `position:relative` của button không tạo stacking
                  context (z-index:auto) nên đẩy chỉ báo xuống -z-10 sẽ khiến nó chui xuống dưới nền
                  trang — nâng phần chữ lên là cách chắc chắn. */}
              <span className="relative z-10 flex items-center gap-1.5">
                {Icon && <Icon size={variant === "underline" ? 15 : 14} className="shrink-0" />}
                {tab.label}
                {!active && (tab.count ?? 0) > 0 && (
                  <span className="rounded-full bg-gray-200/60 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
    </div>
  );
}

interface TabPanelProps {
  /** Đổi giá trị này = đổi tab → chạy chuyển cảnh. */
  value: string;
  children: ReactNode;
  className?: string;
}

/** Bọc nội dung của panel tab (KHÔNG dùng cho filter tab — xem chú thích đầu file). */
export function TabPanel({ value, children, className }: TabPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={value}
        className={className}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
