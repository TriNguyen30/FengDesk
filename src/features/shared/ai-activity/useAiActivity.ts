import { useEffect, useState } from "react";
import { chatHub } from "@/features/chatbox/lib/chatHub";
import type { AiActivity } from "./types";

/**
 * Lắng nghe trạng thái AI realtime của 1 operation (vd "chat-{chatboxId}").
 * `operationId` null → idle, không kết nối. Best-effort: lỗi realtime không throw.
 */
export function useAiActivity(operationId: string | null) {
  // Reset khi đổi operationId (mẫu React "adjusting state when a prop changes" — setState
  // ngay trong render, KHÔNG phải trong effect, để tránh cascading render).
  const [trackedId, setTrackedId] = useState(operationId);
  const [activity, setActivity] = useState<AiActivity | null>(null);
  // Lời dẫn trung gian (phase="narration") — dồn theo lượt, xóa khi done/error/đổi operation.
  const [narrations, setNarrations] = useState<string[]>([]);
  if (operationId !== trackedId) {
    setTrackedId(operationId);
    setActivity(null);
    setNarrations([]);
  }

  useEffect(() => {
    if (!operationId) return;

    let cancelled = false;
    let turnActive = false; // đang trong 1 lượt xử lý AI (giữa phase đầu và done/error)
    const onStatus = (a: AiActivity) => {
      if (a.operationId !== operationId) return;
      if (a.phase === "narration") {
        if (a.note) setNarrations((p) => [...p, a.note!]);
        return; // không đè indicator phase hiện tại
      }
      if (a.phase === "done" || a.phase === "error") {
        // Chỉ tắt indicator — GIỮ narrations hiển thị đến khi lượt mới bắt đầu / user reload.
        turnActive = false;
        setActivity(null);
        return;
      }
      // Phase đầu tiên của một lượt MỚI → dọn narrations của lượt trước.
      if (!turnActive) {
        turnActive = true;
        setNarrations([]);
      }
      setActivity(a);
    };

    (async () => {
      try {
        await chatHub.joinAiOperation(operationId);
        if (cancelled) return;
        chatHub.on<AiActivity>("aiStatus", onStatus);
      } catch {
        /* realtime hỏng không chặn luồng chính */
      }
    })();

    return () => {
      cancelled = true;
      chatHub.off("aiStatus", onStatus as (...a: unknown[]) => void);
      void chatHub.leaveAiOperation(operationId).catch(() => {});
    };
  }, [operationId]);

  return { activity, isActive: activity !== null, narrations };
}
