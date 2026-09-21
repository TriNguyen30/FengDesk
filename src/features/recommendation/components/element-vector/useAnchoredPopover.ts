import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

interface Options {
  /** Bề rộng popover (px) — cần biết trước để canh mép phải và kẹp trong viewport. */
  width: number;
  /** Bám mép nào của phần tử neo. */
  align?: "left" | "right";
  /** Gọi khi trang/cột cuộn trong lúc đang mở — popover `fixed` không trôi theo neo nên đóng là đúng nhất. */
  onClose?: () => void;
}

/**
 * Định vị popover bằng `position: fixed` theo hình chữ nhật của phần tử neo.
 *
 * Vì sao không `absolute` như trước: cột phải của hộp "Điểm này đến từ đâu?" giờ là vùng **cuộn**
 * (`overflow-y: auto`), mà `overflow` cắt mọi thứ `absolute` thò ra ngoài — popover phép tính sẽ bị
 * xén ngang. `fixed` thoát khỏi vùng cắt; đổi lại phải tự tính toạ độ, và khi cuộn thì đóng lại.
 *
 * Bung xuống dưới neo; nếu không đủ chỗ dưới đáy viewport thì bung lên trên. Mép trái/phải kẹp cách
 * viền màn hình 8px để không tràn trên màn hẹp.
 */
export function useAnchoredPopover<T extends HTMLElement>(open: boolean, { width, align = "right", onClose }: Options) {
  const anchorRef = useRef<T>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  // Giữ callback mới nhất trong ref để effect không chạy lại mỗi render chỉ vì caller truyền arrow mới.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useLayoutEffect(() => {
    if (!open) return;
    const el = anchorRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(width, vw - margin * 2);
    let left = align === "right" ? rect.right - w : rect.left;
    left = Math.max(margin, Math.min(left, vw - w - margin));

    // Ước lượng cần ~280px phía dưới; thiếu thì lật lên trên neo.
    const below = vh - rect.bottom;
    const next: CSSProperties = { position: "fixed", left, width: w, zIndex: 50 };
    if (below >= 280 || rect.top < below) {
      next.top = rect.bottom + 4;
      next.maxHeight = vh - rect.bottom - 4 - margin;
    } else {
      next.bottom = vh - rect.top + 4;
      next.maxHeight = rect.top - 4 - margin;
    }
    setStyle(next);

    const close = () => onCloseRef.current?.();
    // capture: bắt cả cuộn của vùng con (cột phải), không chỉ của window.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, width, align]);

  return { anchorRef, style };
}
