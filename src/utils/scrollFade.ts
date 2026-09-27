/**
 * Thanh cuộn tự ẩn, mảnh, mờ dần (fade in/out).
 *
 * ## Vì sao phải tự vẽ thanh cuộn thay vì style scrollbar native
 *
 * Scrollbar native của WebKit **không animate được**. Đã đo trực tiếp trên Chrome (24/09/2026):
 *
 * | Cách | Kết quả đo |
 * |---|---|
 * | `transition` đặt trên `::-webkit-scrollbar-thumb` | bị bỏ qua — màu nhảy tức thì, không có bước trung gian |
 * | `transition` trên biến `@property` mà pseudo-element đọc | **đóng băng** pseudo-element: đổi class cũng không repaint |
 * | `@keyframes` (cả trên biến lẫn trên pseudo-element) | y hệt, không chạy |
 * | đổi biến **không kèm** animation | repaint ngay lập tức ✅ |
 *
 * Nên native chỉ làm được **ẩn/hiện tức thì**. Muốn mờ dần thì buộc phải có một phần tử thật để
 * animate `opacity` — đó là module này.
 *
 * ## Cách làm
 *
 * Ẩn hẳn thanh cuộn native rồi gắn thêm một `<div>` vào **chính container**. Không bọc thêm lớp DOM
 * nào, không đụng tới layout bên trong — đây là lý do nó dán được vào cả bảng, flex, grid mà không
 * phải sửa cấu trúc từng chỗ.
 *
 * Hai chế độ định vị:
 * - **thường**: thumb `position: absolute`, nằm TRONG vùng cuộn nên nó trôi theo nội dung; bù lại
 *   bằng cách cộng `scrollTop`/`scrollLeft` vào transform để nó đứng yên so với khung nhìn.
 * - **gốc trang** (`<html>`): thumb `position: fixed` treo vào `<body>`, vì khung nhìn của nó chính
 *   là viewport. Sự kiện `scroll` của trang bắn ở `document` chứ không ở `documentElement` nên phải
 *   nghe riêng.
 *
 * Thanh cuộn **chỉ hiện khi đang cuộn** (quyết định 25/09) — rê chuột vào vùng cuộn KHÔNG làm nó
 * hiện. Hover chỉ có tác dụng khi con trỏ nằm trên chính thanh, để giữ nó lại cho kịp bấm kéo.
 *
 * Bật bằng cách thêm class `scroll-fade` vào container — {@link initScrollFade} tự tìm và gắn, kể cả
 * phần tử xuất hiện sau (modal, dropdown), và tự gắn luôn cho gốc trang.
 */

/**
 * Dự phòng khi trình duyệt không có `scrollend`: im bấy nhiêu ms không thấy `scroll` nữa thì coi như
 * đã dừng. Có `scrollend` thì ẩn NGAY tại điểm dừng, không chờ gì cả.
 */
const SCROLL_END_FALLBACK_MS = 120;
/** Thanh ngắn quá thì không bấm trúng — ép sàn. */
const MIN_THUMB_PX = 28;
/** Cách mép container. Khớp với `.fd-scroll-thumb` trong index.css. */
const EDGE_GAP = 2;
/** Bề dày phần NHÌN THẤY. Vùng bấm rộng hơn nhiều, do `.fd-scroll-thumb::before` lo. */
const THUMB_SIZE = 2;

const supportsScrollEnd = typeof window !== "undefined" && "onscrollend" in window;

type Axis = "y" | "x";

interface ThumbState {
  el: HTMLDivElement;
  dragging: boolean;
}

interface Controller {
  destroy(): void;
}

const attached = new WeakMap<HTMLElement, Controller>();

const isRootScroller = (el: HTMLElement) => el === document.documentElement || el === document.body;

function attach(el: HTMLElement): Controller {
  const existing = attached.get(el);
  if (existing) return existing;

  const root = isRootScroller(el);
  // Gốc trang thì thumb phải nằm NGOÀI vùng cuộn (fixed theo viewport) — treo vào <body>.
  const host = root ? document.body : el;
  // Sự kiện `scroll` của trang bắn ở `document`, không phải ở `<html>`.
  const scrollSource: EventTarget = root ? document : el;

  const thumbs: Partial<Record<Axis, ThumbState>> = {};
  let hovering = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let frame = 0;

  // Container phải là mốc định vị của thumb. Việc đó do CSS lo (`[data-scroll-fade]` trong
  // @layer base) chứ KHÔNG đặt inline: inline style thắng mọi class, nên sẽ đè chết những chỗ đổi
  // position theo breakpoint như `md:absolute` (ScoreWaterfall). Ở layer base thì utility của
  // Tailwind vẫn thắng, còn phần tử không khai gì mới rơi về `relative`.
  el.dataset.scrollFade = "on";

  const ensure = (axis: Axis): ThumbState => {
    let state = thumbs[axis];
    if (!state) {
      const thumbEl = document.createElement("div");
      thumbEl.className =
        `fd-scroll-thumb fd-scroll-thumb--${axis}` + (root ? " fd-scroll-thumb--fixed" : "");
      // Thanh cuộn không phải nội dung — giấu khỏi trình đọc màn hình.
      thumbEl.setAttribute("aria-hidden", "true");
      // Lần đặt transform ĐẦU TIÊN không được tween, nếu không thumb sẽ trượt một nhát từ góc
      // trên-trái ra đúng chỗ ngay lúc hiện ra.
      thumbEl.style.transition = "none";
      setTimeout(() => thumbEl.style.removeProperty("transition"), 0);
      // Hover ĐẶT TRÊN THUMB, không phải trên container: thanh cuộn chỉ hiện khi CUỘN, nhưng khi đã
      // hiện rồi mà con trỏ đang nằm trên nó thì giữ lại — không thì nó mờ mất trước khi kịp bấm kéo.
      thumbEl.addEventListener("pointerenter", () => {
        hovering = true;
      });
      thumbEl.addEventListener("pointerleave", () => {
        hovering = false;
        armHide(0);
      });
      host.appendChild(thumbEl);
      state = { el: thumbEl, dragging: false };
      thumbs[axis] = state;
      bindDrag(axis, state);
    }
    return state;
  };

  const measure = (axis: Axis) => {
    const track = axis === "y" ? el.clientHeight : el.clientWidth;
    const content = axis === "y" ? el.scrollHeight : el.scrollWidth;
    const offset = axis === "y" ? el.scrollTop : el.scrollLeft;
    const maxScroll = content - track;
    // Ngưỡng 1px: sai số làm tròn của zoom/devicePixelRatio hay tạo ra 0.5px "cuộn được" giả.
    const scrollable = maxScroll > 1;
    const length = scrollable ? Math.max(MIN_THUMB_PX, (track * track) / content) : 0;
    const progress = scrollable ? offset / maxScroll : 0;
    return { track, offset, maxScroll, scrollable, length, progress };
  };

  const render = () => {
    frame = 0;
    (["y", "x"] as Axis[]).forEach((axis) => {
      const m = measure(axis);
      if (!m.scrollable) {
        thumbs[axis]?.el.style.setProperty("display", "none");
        return;
      }
      const state = ensure(axis);
      state.el.style.removeProperty("display");

      // Vị trí dọc theo trục cuộn, tính trong khung nhìn của container...
      const along = m.progress * (m.track - m.length);
      // ...rồi cộng phần đã cuộn. Thumb absolute nằm TRONG vùng cuộn nên mặc định nó trôi theo nội
      // dung; cộng vào là ghim nó đứng yên so với khung nhìn. Thumb fixed đã theo viewport sẵn, và
      // mép của nó do CSS đặt, nên chỉ cần dịch theo đúng trục cuộn.
      const shiftY = root ? 0 : el.scrollTop;
      const shiftX = root ? 0 : el.scrollLeft;
      if (axis === "y") {
        state.el.style.height = `${m.length}px`;
        const x = root ? 0 : shiftX + el.clientWidth - THUMB_SIZE - EDGE_GAP;
        state.el.style.transform = `translate(${x}px, ${shiftY + along}px)`;
      } else {
        state.el.style.width = `${m.length}px`;
        const y = root ? 0 : shiftY + el.clientHeight - THUMB_SIZE - EDGE_GAP;
        state.el.style.transform = `translate(${shiftX + along}px, ${y}px)`;
      }
    });
  };

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(render);
  };

  const anyDragging = () => Object.values(thumbs).some((t) => t?.dragging);

  const hide = () => {
    if (hovering || anyDragging()) return;
    Object.values(thumbs).forEach((t) => t && (t.el.dataset.visible = "false"));
  };

  /** Hẹn giờ ẩn. `0` = ẩn ở lượt sau, dùng khi đã biết chắc cuộn đã dừng. */
  const armHide = (delay: number) => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(hide, delay);
  };

  const show = () => {
    schedule();
    Object.values(thumbs).forEach((t) => t && (t.el.dataset.visible = "true"));
    if (idleTimer) clearTimeout(idleTimer);
  };

  function bindDrag(axis: Axis, state: ThumbState) {
    state.el.addEventListener("pointerdown", (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const m = measure(axis);
      const startPointer = axis === "y" ? e.clientY : e.clientX;
      const startScroll = axis === "y" ? el.scrollTop : el.scrollLeft;
      const travel = m.track - m.length;
      state.dragging = true;
      state.el.dataset.dragging = "true";
      state.el.setPointerCapture(e.pointerId);

      const move = (ev: PointerEvent) => {
        const delta = (axis === "y" ? ev.clientY : ev.clientX) - startPointer;
        // Kéo 1px trên thanh = maxScroll/travel px nội dung. travel = 0 nghĩa là thumb dài bằng
        // track (không cuộn được) — đã lọc ở trên, nhưng vẫn chặn để không chia cho 0.
        if (travel <= 0) return;
        const next = startScroll + (delta / travel) * m.maxScroll;
        if (axis === "y") el.scrollTop = next;
        else el.scrollLeft = next;
      };
      const up = (ev: PointerEvent) => {
        state.dragging = false;
        delete state.el.dataset.dragging;
        state.el.releasePointerCapture(ev.pointerId);
        state.el.removeEventListener("pointermove", move);
        state.el.removeEventListener("pointerup", up);
        state.el.removeEventListener("pointercancel", up);
        armHide(0);
      };
      state.el.addEventListener("pointermove", move);
      state.el.addEventListener("pointerup", up);
      state.el.addEventListener("pointercancel", up);
    });
  }

  const onScroll = () => {
    show();
    // Có `scrollend` thì để nó quyết định điểm dừng; không thì đoán bằng khoảng lặng.
    if (!supportsScrollEnd) armHide(SCROLL_END_FALLBACK_MS);
  };
  const onScrollEnd = () => armHide(0);

  scrollSource.addEventListener("scroll", onScroll, { passive: true });
  if (supportsScrollEnd) scrollSource.addEventListener("scrollend", onScrollEnd);

  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(el);
  // Nội dung đổi (thêm tin nhắn, lọc danh sách) thì tỉ lệ thumb phải đổi theo. rAF gom lại nên một
  // đợt thay đổi lớn cũng chỉ vẽ một lần.
  const mutationObserver = new MutationObserver(schedule);
  mutationObserver.observe(el, { childList: true, subtree: true, characterData: true });

  // Vẽ NGAY, không qua rAF: khi trang đang ẩn (tab nền) rAF bị đóng băng, thumb sẽ không tồn tại
  // cho tới lúc trang hiện lại. Các lượt cập nhật sau mới cần gom qua rAF.
  render();

  const controller: Controller = {
    destroy() {
      if (idleTimer) clearTimeout(idleTimer);
      if (frame) cancelAnimationFrame(frame);
      scrollSource.removeEventListener("scroll", onScroll);
      if (supportsScrollEnd) scrollSource.removeEventListener("scrollend", onScrollEnd);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      Object.values(thumbs).forEach((t) => t?.el.remove());
      delete el.dataset.scrollFade;
      attached.delete(el);
    },
  };
  attached.set(el, controller);
  return controller;
}

/** Gắn cho một phần tử cụ thể (dùng trong hook React). Trả hàm gỡ. */
export function attachScrollFade(el: HTMLElement): () => void {
  return attach(el).destroy;
}

/**
 * Bật cho cả ứng dụng. Gọi một lần lúc khởi động.
 *
 * - Gốc trang (`<html>`) — thanh cuộn hay thấy nhất — luôn được gắn.
 * - Container có class `scroll-fade` → thanh cuộn overlay, có fade.
 * - Container nào còn sót (tạo động, không mang class) → thanh cuộn native, ẩn khi đứng yên. Không
 *   fade được (xem bảng đo ở đầu file) nhưng vẫn hơn hẳn việc luôn hiện, và **không** gây nhảy
 *   layout vì gutter giữ nguyên bề rộng, chỉ màu thumb đổi.
 */
export function initScrollFade() {
  attach(document.documentElement);

  const scan = (root: ParentNode) =>
    root.querySelectorAll<HTMLElement>(".scroll-fade").forEach(attach);

  scan(document);
  new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.classList.contains("scroll-fade")) attach(node);
        scan(node);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // --- Thanh cuộn native còn sót: ẩn khi đứng yên ---
  const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
  document.addEventListener(
    "scroll",
    (e) => {
      // `scroll` không bubble nên phải bắt ở pha capture; target có thể là chính document.
      const target = e.target === document ? document.documentElement : e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.scrollFade) return; // đã có overlay riêng
      target.dataset.scrolling = "true";
      const prev = timers.get(target);
      if (prev) clearTimeout(prev);
      timers.set(
        target,
        setTimeout(() => delete target.dataset.scrolling, SCROLL_END_FALLBACK_MS),
      );
    },
    true,
  );
}

export const SCROLL_FADE_METRICS = { EDGE_GAP, THUMB_SIZE, SCROLL_END_FALLBACK_MS };
