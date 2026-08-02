import { useEffect, useRef, useState } from "react";
import type { AiActivity } from "./types";
import { useThinkingStream } from "./useThinkingStream";

/**
 * Điều tiết nhịp hiển thị trạng thái AI: UI chạy CHẬM HƠN model một chút để chuỗi suy luận được gõ mượt.
 *
 * Vấn đề nếu không có lớp này: model xả xong thinking rồi đổi ngay sang calling_tool/writing/done, còn
 * animation mới gõ được nửa câu — dòng chữ bị cắt cụt giữa chừng, hoặc indicator biến mất đột ngột.
 *
 * Cách xử lý: sự kiện phase KẾ TIẾP bị xếp hàng cho tới khi gõ xong chuỗi đang dở, rồi mới hiển thị.
 * Không dùng delay cứng — thời gian xả tự co giãn theo lượng chữ còn tồn (tốc độ gõ đã tự thích nghi
 * nên thực tế luôn dưới ~1s). <see cref="MAX_HOLD_MS"/> chỉ là phanh an toàn cho trường hợp bất thường
 * (vd tab bị ẩn → rAF ngừng chạy → không bao giờ xả xong).
 */

/** Trần thời gian giữ một phase trong hàng đợi, kể cả khi chưa gõ xong. */
const MAX_HOLD_MS = 1500;

/** Sự kiện đang chờ tới lượt. Bọc trong object vì `null` cũng là một giá trị hợp lệ (kết thúc lượt). */
interface Queued {
  value: AiActivity | null;
}

/**
 * @param raw sự kiện mới nhất từ hub (null = lượt đã kết thúc).
 * @param resetKey đổi giá trị → bỏ hết hàng đợi và reset ngay (vd chuyển sang operation khác).
 */
export function usePacedAiActivity(
  raw: AiActivity | null,
  resetKey?: string | null,
): AiActivity | null {
  const [shown, setShown] = useState<AiActivity | null>(null);
  // Đuôi suy luận đang gõ. Giữ TÁCH KHỎI `shown` để phase mới ập tới không xóa mất chuỗi đang dở.
  const [tail, setTail] = useState<string | null>(null);
  const [queued, setQueued] = useState<Queued | null>(null);

  const { text, draining } = useThinkingStream(tail, { active: tail !== null });

  // Đọc trong callback/effect khác mà không muốn tạo phụ thuộc → giữ bản ref.
  const drainingRef = useRef(draining);
  drainingRef.current = draining;

  useEffect(() => {
    setShown(null);
    setTail(null);
    setQueued(null);
  }, [resetKey]);

  useEffect(() => {
    // Đuôi suy luận mới → cập nhật thẳng, không qua hàng đợi (vẫn cùng một phase thinking).
    if (raw?.phase === "thinking" && raw.note) {
      setQueued(null);
      setTail(raw.note);
      setShown(raw);
      return;
    }
    // Còn chữ chưa gõ hết → xếp hàng, giữ nguyên màn hình cho tới khi xả xong.
    if (drainingRef.current) {
      setQueued({ value: raw });
      return;
    }
    setTail(null);
    setShown(raw);
  }, [raw]);

  // Xả xong → cho sự kiện đang chờ lên hình.
  useEffect(() => {
    if (draining || !queued) return;
    setTail(null);
    setShown(queued.value);
    setQueued(null);
  }, [draining, queued]);

  // Phanh an toàn: không để hàng đợi kẹt vĩnh viễn nếu animation không bao giờ xả xong.
  useEffect(() => {
    if (!queued) return;
    const t = setTimeout(() => {
      setTail(null);
      setShown(queued.value);
      setQueued(null);
    }, MAX_HOLD_MS);
    return () => clearTimeout(t);
  }, [queued]);

  if (!shown) return null;
  // Đang gõ chuỗi suy luận → thay note thô bằng đoạn đã gõ (rỗng lúc đầu → indicator hiện "Thinking...").
  return tail !== null ? { ...shown, note: text } : shown;
}
