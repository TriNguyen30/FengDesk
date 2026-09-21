import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { chatHub } from "@/features/chatbox/lib/chatHub";
import type { WorkspaceProfileDraft } from "../types/workspace";
import { getWorkspaceIntakeStatus, startParseWorkspace } from "../api/workspaceIntake.api";

export type WorkspaceIntakeStatus = "idle" | "starting" | "running" | "done" | "failed";

// Backup poll khi SignalR rớt event (Ollama không ổn định): realtime là chính, poll bảo hiểm.
const POLL_INTERVAL_MS = 5000;

/**
 * AI intake ASYNC: bấm "AI điền giúp" → đẩy job nền, vào ngay trang điền trong lúc AI chạy; kết quả về
 * qua SignalR ("workspaceIntakeResult"). Có poll fallback theo operationId cho trường hợp lỡ event / F5.
 *
 * `resume(operationId)`: nối lại một job đã bắt đầu ở lần mở trước (đóng modal / đổi trang / F5 — nháp
 * giữ operationId). Cùng effect với `start`: join group + poll ngay, job đã xong thì lần poll đầu trả
 * draft luôn. BE chỉ giữ job 30'; quá hạn poll nhận 404 → coi là "failed" với lời nhắc phân tích lại.
 */
export function useWorkspaceIntake() {
  const [operationId, setOperationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WorkspaceProfileDraft | null>(null);
  const [status, setStatus] = useState<WorkspaceIntakeStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Cờ đã kết thúc (done/failed) để dừng poll & bỏ qua event đến muộn.
  const settledRef = useRef(false);

  useEffect(() => {
    if (!operationId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const finishDone = (d: WorkspaceProfileDraft) => {
      if (cancelled || settledRef.current) return;
      settledRef.current = true;
      setDraft(d);
      setStatus("done");
    };
    const finishFailed = (message?: string | null) => {
      if (cancelled || settledRef.current) return;
      settledRef.current = true;
      setError(message ?? "Trợ lý đang bận, bạn có thể điền form thủ công.");
      setStatus("failed");
    };

    const onResult = (d: WorkspaceProfileDraft) => finishDone(d);
    const onFailed = (p: { message?: string }) => finishFailed(p?.message);

    const stopPolling = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const poll = async () => {
      if (cancelled || settledRef.current) return stopPolling();
      try {
        const st = await getWorkspaceIntakeStatus(operationId);
        if (st.status === "done" && st.draft) finishDone(st.draft);
        else if (st.status === "failed") finishFailed(st.message);
        if (settledRef.current) stopPolling();
      } catch (e) {
        // 404 = BE không còn job này (quá TTL 30'). Không phải lỗi tạm — chờ thêm cũng không ra kết quả.
        if (isAxiosError(e) && e.response?.status === 404)
          finishFailed("Phiên phân tích trước đã hết hạn - bạn có thể bấm phân tích lại.");
        /* lỗi khác: job có thể chưa kịp vào cache / lỗi tạm — cứ để lần poll sau hoặc realtime lo */
      }
    };

    (async () => {
      try {
        await chatHub.joinAiOperation(operationId);
        if (cancelled) return;
        chatHub.on<WorkspaceProfileDraft>("workspaceIntakeResult", onResult);
        chatHub.on<{ message?: string }>("workspaceIntakeFailed", onFailed);
      } catch {
        /* realtime hỏng → dựa hoàn toàn vào poll */
      }
      // Bắt kịp trường hợp job xong TRƯỚC khi kịp join (race), rồi poll định kỳ làm lưới an toàn.
      await poll();
      if (!cancelled && !settledRef.current) timer = setInterval(poll, POLL_INTERVAL_MS);
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      chatHub.off("workspaceIntakeResult", onResult as (...a: unknown[]) => void);
      chatHub.off("workspaceIntakeFailed", onFailed as (...a: unknown[]) => void);
      void chatHub.leaveAiOperation(operationId).catch(() => {});
    };
  }, [operationId]);

  const start = useCallback(async (description: string, imageUrls?: string[], think?: boolean) => {
    settledRef.current = false;
    setDraft(null);
    setError(null);
    setStatus("starting");
    try {
      const { operationId: opId } = await startParseWorkspace(description, imageUrls, think);
      setStatus("running");
      setOperationId(opId); // trigger effect join + poll
      return opId;
    } catch (e) {
      const message = isAxiosError<{ message?: string }>(e) ? e.response?.data?.message : undefined;
      setError(message ?? "Không bắt đầu được phân tích. Bạn có thể điền form thủ công.");
      setStatus("failed");
      throw e;
    }
  }, []);

  /** Nối lại job đã có (từ nháp). Không gọi API start; effect theo operationId sẽ join + poll. */
  const resume = useCallback((opId: string) => {
    settledRef.current = false;
    setDraft(null);
    setError(null);
    setStatus("running");
    setOperationId(opId);
  }, []);

  const reset = useCallback(() => {
    settledRef.current = false;
    setOperationId(null);
    setDraft(null);
    setError(null);
    setStatus("idle");
  }, []);

  const isRunning = status === "starting" || status === "running";

  return { start, resume, reset, operationId, draft, status, error, isRunning };
}
