import { useEffect, useRef, useState } from "react";

/**
 * Biến chuỗi "đuôi suy luận" BE bắn về thành một dòng chữ chạy mượt.
 *
 * BE gom delta rồi cứ ~120ms phát PHẦN ĐUÔI (~180 ký tự) của cả chuỗi thinking → hai lần phát liên tiếp
 * chồng lấn nhau rất nhiều, nhưng nếu render thẳng thì chữ nhảy cục từng nhịp. Hook này:
 *   1. ghép các đuôi lại thành một chuỗi liền mạch (dò overlap),
 *   2. "gõ" ra từng ký tự bằng rAF với tốc độ tự thích nghi theo lượng tồn đọng.
 *
 * Cố ý CHẠY SAU model: cờ `draining` cho phía gọi biết còn chữ chưa gõ hết, để hoãn việc chuyển sang
 * phase kế tiếp (xem `usePacedAiActivity`).
 */

/**
 * Mặc định KHÔNG cắt bớt đầu chuỗi. Indicator hiển thị dạng khối nhiều dòng và tự cuộn dọc, nên phần
 * chữ cũ chỉ cần trôi ra khỏi khung. Cắt ký tự ở đầu sẽ làm cả khối ngắt dòng lại → giật.
 * Giới hạn thật nằm ở `BUFFER_LIMIT` (và buffer reset mỗi lượt suy luận).
 */
const MAX_CHARS = Number.POSITIVE_INFINITY;
/** Tốc độ gõ tối thiểu (ký tự/giây) khi gần bắt kịp model. */
const MIN_CPS = 30;
/** Mỗi ký tự tồn đọng cộng thêm bấy nhiêu ký tự/giây — tồn nhiều thì đuổi nhanh, không bị trễ lê thê. */
const CATCHUP_CPS_PER_CHAR = 5;
/** Trần bộ nhớ chuỗi đã ghép; vượt thì cắt bớt đầu (phần đó chắc chắn đã trôi khỏi cửa sổ). */
const BUFFER_LIMIT = 4000;
const BUFFER_KEEP = 1500;

/** Ghép đuôi mới vào chuỗi đang có: tìm overlap dài nhất giữa hậu tố hiện tại và tiền tố đuôi mới. */
function mergeTail(current: string, incoming: string): string {
  if (!current) return incoming;
  if (current.endsWith(incoming)) return current; // đuôi cũ hơn / trùng lặp
  const max = Math.min(current.length, incoming.length);
  for (let k = max; k > 0; k--) {
    if (current.endsWith(incoming.slice(0, k))) return current + incoming.slice(k);
  }
  // Không tìm được điểm nối (model nhảy quá xa giữa 2 nhịp) → nối tiếp, chấp nhận hụt một đoạn.
  return `${current} ${incoming}`;
}

export interface ThinkingStreamState {
  /** Đoạn đã "gõ" xong, tối đa `maxChars` ký tự cuối. */
  text: string;
  /** Còn ký tự trong buffer chưa gõ ra màn hình. */
  draining: boolean;
}

export interface UseThinkingStreamOptions {
  /** false → dừng animation và xóa buffer (vd lượt đã kết thúc). */
  active?: boolean;
  /** Chỉ giữ bấy nhiêu ký tự cuối. Mặc định Infinity — xem chú thích `MAX_CHARS`. */
  maxChars?: number;
}

/**
 * @param tail đuôi chuỗi suy luận mới nhất từ BE (`activity.note`), null khi không có gì để gõ.
 */
export function useThinkingStream(
  tail: string | null | undefined,
  { active = true, maxChars = MAX_CHARS }: UseThinkingStreamOptions = {},
): ThinkingStreamState {
  const fullRef = useRef("");
  const revealedRef = useRef(0);
  const [state, setState] = useState<ThinkingStreamState>({ text: "", draining: false });

  // Reset khi lượt kết thúc — lượt sau bắt đầu lại từ chuỗi rỗng thay vì nối vào suy luận cũ.
  useEffect(() => {
    if (active) return;
    fullRef.current = "";
    revealedRef.current = 0;
    setState({ text: "", draining: false });
  }, [active]);

  // Nhận đuôi mới → ghép vào buffer. Không setState text ở đây: rAF lo phần hiển thị.
  useEffect(() => {
    if (!active || !tail) return;
    // Ép về 1 dòng TRƯỚC khi ghép: chuỗi suy luận có xuống dòng, mà indicator chỉ có 1 dòng. Chuẩn hóa
    // đồng nhất ở cả 2 vế nên việc dò overlap không bị lệch.
    let merged = mergeTail(fullRef.current, tail.replace(/\s+/g, " "));
    if (merged.length > BUFFER_LIMIT) {
      const cut = merged.length - BUFFER_KEEP;
      merged = merged.slice(cut);
      revealedRef.current = Math.max(0, revealedRef.current - cut);
    }
    fullRef.current = merged;
    // Bật `draining` NGAY khi có chữ mới, không đợi frame kế: phía gọi có thể đọc cờ này trong cùng
    // nhịp sự kiện với đuôi vừa tới, chậm một frame là nó tưởng đã gõ xong và đổi phase mất.
    setState((s) =>
      s.draining || revealedRef.current >= merged.length ? s : { ...s, draining: true },
    );
  }, [tail, active]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    let shownChars = -1;
    let shownDraining: boolean | null = null;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.25); // tab ẩn quay lại: chặn bước nhảy khổng lồ
      last = now;

      const total = fullRef.current.length;
      const backlog = total - revealedRef.current;
      if (backlog > 0) {
        const cps = MIN_CPS + backlog * CATCHUP_CPS_PER_CHAR;
        revealedRef.current = Math.min(total, revealedRef.current + cps * dt);
      }

      const n = Math.floor(revealedRef.current);
      const draining = n < total;
      if (n !== shownChars || draining !== shownDraining) {
        shownChars = n;
        shownDraining = draining;
        setState({ text: fullRef.current.slice(0, n).slice(-maxChars), draining });
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, maxChars]);

  return state;
}
