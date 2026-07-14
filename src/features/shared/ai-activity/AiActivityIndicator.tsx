import { AlertTriangle, Bot, Loader2, PenLine, Wrench } from "lucide-react";
import type { AiActivity } from "./types";

interface AiActivityIndicatorProps {
  activity: AiActivity;
}

/** BE gửi kèm "note" thân thiện (vd "Đang chuẩn bị đơn hàng của bạn…") cho phase calling_tool —
 * ưu tiên hiển thị note đó; nếu tool nào BE chưa map thì fallback về text mặc định (không lộ tên tool thô). */
export default function AiActivityIndicator({ activity }: AiActivityIndicatorProps) {
  const { phase, note } = activity;

  const { icon, label } = (() => {
    if (phase === "calling_tool") {
      return { icon: <Wrench size={13} />, label: note ?? "Đang tra cứu dữ liệu…" };
    }
    if (phase === "writing") {
      return { icon: <PenLine size={13} />, label: "Đang tạo kết quả…" };
    }
    if (phase === "error") {
      return { icon: <AlertTriangle size={13} />, label: "Có lỗi xảy ra" };
    }
    return {
      icon: <Loader2 size={13} className="animate-spin" />,
      label: "AI đang xử lý…",
    };
  })();

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-gray-600">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bot size={13} />
        </span>
        <span className="flex items-center gap-1.5">
          {icon}
          <span>{label}...</span>
        </span>
      </div>
    </div>
  );
}
