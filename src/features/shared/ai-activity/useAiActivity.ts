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
  if (operationId !== trackedId) {
    setTrackedId(operationId);
    setActivity(null);
  }

  useEffect(() => {
    if (!operationId) return;

    let cancelled = false;
    const onStatus = (a: AiActivity) => {
      if (a.operationId !== operationId) return;
      setActivity(a.phase === "done" || a.phase === "error" ? null : a);
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

  return { activity, isActive: activity !== null };
}
