import { useEffect, type RefObject } from "react";
import { SCROLL_SNAPPING_ENABLED } from "@/config/scrollBehavior";

/** Khoảng lặng (ms) giữa hai sự kiện wheel để coi là cú cuộn MỚI — nuốt trọn đuôi quán tính của trackpad. */
const GESTURE_IDLE_MS = 160;
/** Dự phòng khi trình duyệt không bắn `scrollend` (Safari < 18). */
const ANIMATION_FALLBACK_MS = 700;

/**
 * Cuộn theo trang bằng chuột / trackpad: mỗi cú cuộn — mạnh hay nhẹ — đi THẲNG tới mốc kế tiếp bằng smooth
 * scroll native, thay cho `scroll-snap: mandatory`.
 *
 * Vì sao không dùng CSS snap cho chuột: snap để nội dung trôi tự do trước, dừng rồi mới hút về mốc gần nhất
 * → kéo được 3 dòng thì bị giật tiếp sang dòng 4 (hai nhịp). Ở đây chỉ có một nhịp. Cảm ứng không đi qua
 * wheel nên vẫn dùng CSS snap native (có quán tính, không giật) — xem `pointer-coarse:` ở chỗ dùng.
 *
 * Chi phí: một listener wheel (non-passive) + đọc vài `offsetTop` mỗi cú cuộn; animation do trình duyệt lo.
 *
 * @param getStops trả về các mốc `scrollTop` (px), tăng dần. Mốc cuối cùng (đáy) được tự thêm.
 */
export function useWheelPaging(
  containerRef: RefObject<HTMLElement | null>,
  getStops: () => number[],
  enabled: boolean,
) {
  useEffect(() => {
    const el = containerRef.current;
    // TẠM TẮT (01/10/2026) — xem `@/config/scrollBehavior`. Không gắn listener `wheel` nào thì
    // chuột/trackpad quay về cuộn tự do như mọi trang khác.
    if (!el || !enabled || !SCROLL_SNAPPING_ENABLED) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animating = false;
    let lastWheelAt = 0;
    let fallbackTimer: number | undefined;

    const finishAnimation = () => {
      animating = false;
      window.clearTimeout(fallbackTimer);
    };

    const onWheel = (e: WheelEvent) => {
      // Zoom (ctrl + wheel) và cuộn ngang: để trình duyệt tự xử lý.
      if (e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      const now = performance.now();
      const sameGesture = now - lastWheelAt < GESTURE_IDLE_MS;
      lastWheelAt = now;

      // Đang chạy hoặc vẫn là đuôi của cú cuộn trước → nuốt, không cho trôi tự do.
      if (animating || sameGesture) {
        e.preventDefault();
        return;
      }

      const maxTop = el.scrollHeight - el.clientHeight;
      const stops = [...getStops().filter((s) => s < maxTop - 1), maxTop];
      const current = el.scrollTop;
      const target =
        e.deltaY > 0
          ? stops.find((s) => s > current + 1)
          : [...stops].reverse().find((s) => s < current - 1);

      // Đã ở mép trên/dưới → nhả sự kiện cho trang cuộn tiếp, không giam người dùng trong khung.
      if (target === undefined) return;

      e.preventDefault();
      animating = true;
      el.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
      fallbackTimer = window.setTimeout(finishAnimation, ANIMATION_FALLBACK_MS);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scrollend", finishAnimation);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scrollend", finishAnimation);
      window.clearTimeout(fallbackTimer);
    };
  }, [containerRef, getStops, enabled]);
}
