/**
 * Công tắc TẠM cho cơ chế **điều khiển** cuộn (01/10/2026).
 *
 * Phân biệt rạch ròi hai thứ hay bị gộp làm một:
 *
 * - **Hành vi** — thứ quyết định con trỏ cuộn ĐI ĐÂU, cướp quyền khỏi trình duyệt. Chỉ có hai:
 *   1. `src/hooks/useWheelPaging.ts` — nuốt sự kiện `wheel` rồi tự `scrollTo` tới mốc kế tiếp.
 *   2. CSS `scroll-snap` — các class `snap-x` / `snap-y` / `snap-start` rải trong component.
 *   Cả hai tắt bằng hằng số dưới đây.
 *
 * - **Vẻ ngoài** — `src/utils/scrollFade.ts`: thanh mảnh 2px, tự mờ đi khi ngừng cuộn, màu theo theme.
 *   **KHÔNG nằm trong công tắc này và không bị tắt.** Đã soát: nó không có listener `wheel`/`touch`
 *   nào, listener `scroll` là `{ passive: true }` (về mặt kỹ thuật không `preventDefault` được), và
 *   `preventDefault` duy nhất nằm ở `pointerdown` trên chính cái thumb — chặn bôi đen trong lúc kéo,
 *   đúng như thanh cuộn native vẫn làm. Nó không đụng tới việc cuộn đi đâu.
 *
 * Bật lại snapping = đổi đúng hằng này về `true`, không phải đi gỡ các class `snap-*` trong 7 component.
 *
 * CSS không đọc được hằng TS, nên {@link applyScrollBehaviorFlag} ghi `data-scroll-snap="off"` lên
 * `<html>`; `index.css` có một khối tương ứng vô hiệu hoá mọi `scroll-snap-*`.
 */
export const SCROLL_SNAPPING_ENABLED = false;

/** Gọi một lần lúc khởi động, TRƯỚC render, để CSS có mốc ngay từ khung hình đầu. */
export function applyScrollBehaviorFlag(): void {
  if (SCROLL_SNAPPING_ENABLED) {
    delete document.documentElement.dataset.scrollSnap;
    return;
  }
  document.documentElement.dataset.scrollSnap = "off";
}
