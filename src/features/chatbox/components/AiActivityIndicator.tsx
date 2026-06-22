import { Bot, Loader2, PenLine, Wrench } from "lucide-react";
import type { AiActivity } from "@/features/chatbox/types/chatbox";

/** Tên kỹ thuật của tool → nhãn thân thiện tiếng Việt. */
const TOOL_LABELS: Record<string, string> = {
  get_my_profile: "hồ sơ của bạn",
  list_my_workspaces: "không gian làm việc",
  list_my_orders: "đơn hàng",
  get_payment_status: "trạng thái thanh toán",
  search_products: "danh mục sản phẩm",
  get_product: "thông tin sản phẩm",
  recommend_products: "gợi ý phong thủy",
  get_chat_partner_info: "thông tin được chia sẻ",
};

interface AiActivityIndicatorProps {
  activity: AiActivity;
}

export default function AiActivityIndicator({ activity }: AiActivityIndicatorProps) {
  const { phase, toolName } = activity;

  const { icon, label } = (() => {
    if (phase === "calling_tool") {
      const friendly = (toolName && TOOL_LABELS[toolName]) || "dữ liệu";
      return { icon: <Wrench size={13} />, label: `Đang tra cứu ${friendly}…` };
    }
    if (phase === "writing") {
      return { icon: <PenLine size={13} />, label: "Đang soạn câu trả lời…" };
    }
    return { icon: <Loader2 size={13} className="animate-spin" />, label: "Trợ lý AI đang suy nghĩ…" };
  })();

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-gray-600">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bot size={13} />
        </span>
        <span className="flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </span>
      </div>
    </div>
  );
}
