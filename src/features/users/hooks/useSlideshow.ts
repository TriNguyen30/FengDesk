import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Mỗi ảnh nền đứng bao lâu trước khi mờ sang ảnh kế — chỉnh tại đây. */
export const WORKSPACE_SLIDESHOW_INTERVAL_MS = 6000;

/**
 * Chỉ số ảnh đang hiện của trình chiếu, tự tăng sau `intervalMs`. Không tự chạy khi: chỉ 1 ảnh, user bật
 * "giảm chuyển động", đang `paused` (vd rê chuột vào nút điều khiển), hoặc tab đang ẩn.
 */
export function useSlideshow(count: number, intervalMs = WORKSPACE_SLIDESHOW_INTERVAL_MS) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (count < 2 || reduceMotion || paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [count, reduceMotion, paused, intervalMs]);

  // Gỡ ảnh làm `count` giảm → kẹp lại để không trỏ ra ngoài mảng.
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;
  return { index: safeIndex, setIndex, setPaused };
}
