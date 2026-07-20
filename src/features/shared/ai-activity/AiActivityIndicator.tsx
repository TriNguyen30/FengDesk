import { AlertTriangle, Bot, Brain, Loader2, PenLine, Wrench } from "lucide-react";
import type { AiActivity } from "./types";

interface AiActivityIndicatorProps {
  activity: AiActivity;
}

/** BE gửi kèm "note" thân thiện cho phase calling_tool (nhãn tool) và phase thinking (ĐUÔI chuỗi suy luận
 * đang stream — "chữ chạy"). Ưu tiên hiển thị note; thiếu thì fallback text mặc định. */
export default function AiActivityIndicator({ activity }: AiActivityIndicatorProps) {
  const { phase, note } = activity;

  // Thinking có note = chuỗi suy luận đang stream → hiện trên 1 dòng, cắt gọn, chạy chữ.
  const isThinkingStream = phase === "thinking" && !!note;

  const { icon, label } = (() => {
    if (isThinkingStream) {
      return { icon: <Brain size={13} className="shrink-0" />, label: note! };
    }
    if (phase === "calling_tool") {
      return {
        icon: <Wrench size={13} className="shrink-0" />,
        label: note ?? "Đang tra cứu dữ liệu…",
      };
    }
    if (phase === "writing") {
      return { icon: <PenLine size={13} className="shrink-0" />, label: "Đang tạo kết quả…" };
    }
    if (phase === "error") {
      return { icon: <AlertTriangle size={13} className="shrink-0" />, label: "Có lỗi xảy ra" };
    }
    return {
      icon: <Loader2 size={13} className="shrink-0 animate-spin" />,
      label: "AI đang xử lý",
    };
  })();

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-md border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-gray-600">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bot size={13} />
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          {icon}
          {/* Thinking: 1 dòng, cắt gọn (note đã là phần đuôi từ BE → cảm giác chữ chạy). Khác: thêm "…". */}
          <span className={isThinkingStream ? "truncate italic opacity-80" : ""}>
            {label}
            {!isThinkingStream && "..."}
          </span>
        </span>
      </div>
    </div>
  );
}
