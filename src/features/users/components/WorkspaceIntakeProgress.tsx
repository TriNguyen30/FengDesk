import { AlertTriangle, Bot, Loader2, Sparkles } from "lucide-react";
import { useAiActivity } from "@/features/shared/ai-activity";
import type { WorkspaceIntakeStatus } from "../hooks/useWorkspaceIntake";

interface WorkspaceIntakeProgressProps {
  operationId: string | null;
  status: WorkspaceIntakeStatus;
  error?: string | null;
}

/**
 * Banner tiến trình cho luồng "AI điền giúp" chạy nền: user đã vào trang điền, thanh progress + trạng thái
 * thinking realtime (qua SignalR) cho họ biết AI còn đang chạy. Ẩn khi xong (done) — form đã tự prefill.
 */
export default function WorkspaceIntakeProgress({
  operationId,
  status,
  error,
}: WorkspaceIntakeProgressProps) {
  const { activity } = useAiActivity(status === "running" ? operationId : null);

  if (status === "idle" || status === "done") return null;

  if (status === "failed") {
    return (
      <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>{error ?? "Trợ lý đang bận. Bạn cứ điền form thủ công bên dưới nhé."}</span>
      </div>
    );
  }

  // starting | running
  const label =
    activity?.phase === "writing"
      ? "AI đang tạo kết quả…"
      : activity?.note
        ? activity.note
        : status === "starting"
          ? "Đang gửi yêu cầu…"
          : "AI đang phân tích không gian của bạn…";

  return (
    <div className="mx-6 mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
      <style>{`@keyframes wsIntakeBar{0%{margin-left:-40%}100%{margin-left:100%}}`}</style>
      <div className="flex items-center gap-2 text-xs font-medium text-primary">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
          <Bot size={13} />
        </span>
        <Loader2 size={13} className="shrink-0 animate-spin" />
        <span className="min-w-0 flex-1 truncate whitespace-nowrap">{label}</span>
        <Sparkles size={12} className="ml-auto shrink-0 opacity-70" />
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full w-2/5 rounded-full bg-primary/60"
          style={{ animation: "wsIntakeBar 1.2s ease-in-out infinite" }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500">
        Bạn có thể bắt đầu điền tay trong lúc chờ — AI xong sẽ tự điền các mục còn nhận ra được.
      </p>
    </div>
  );
}
