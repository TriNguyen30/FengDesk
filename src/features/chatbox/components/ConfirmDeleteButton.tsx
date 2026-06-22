import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  size?: number;
  label?: string;
  /** Class layout luôn áp (vd margin). */
  className?: string;
  /** Class màu cho trạng thái CHƯA "armed". Khi armed luôn chuyển đỏ. */
  idleClassName?: string;
}

/**
 * Nút xóa 2 nhịp (không popup): bấm lần 1 → chuyển ĐỎ (armed) cảnh báo; bấm lần 2 → thực thi.
 * Tự hủy armed sau 3s nếu không bấm tiếp. Hợp tông UI hơn window.confirm.
 */
export default function ConfirmDeleteButton({
  onConfirm,
  disabled = false,
  size = 15,
  label = "Xóa",
  className = "",
  idleClassName = "text-gray-300 hover:bg-red-50 hover:text-red-500",
}: ConfirmDeleteButtonProps) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handle = (e: MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (!armed) {
      setArmed(true);
      timer.current = window.setTimeout(() => setArmed(false), 3000);
      return;
    }
    window.clearTimeout(timer.current);
    setArmed(false);
    onConfirm();
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={disabled}
      aria-label={label}
      title={armed ? "Bấm lần nữa để xóa" : label}
      className={`shrink-0 rounded-lg p-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${className} ${
        armed ? "bg-red-500 text-white hover:bg-red-600" : idleClassName
      }`}
    >
      <Trash2 size={size} className={armed ? "animate-[ai-badge-up_0.15s_ease-out]" : ""} />
    </button>
  );
}
