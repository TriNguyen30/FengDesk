import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import type { ChatMessage } from "@/features/chatbox/types/chatbox";
import { AiActivityIndicator, type AiActivity } from "@/features/shared/ai-activity";
import ChatMessageBubble from "./ChatMessageBubble";

/** Còn cách đáy dưới ngưỡng này (px) thì coi như người dùng đang theo dõi tin mới. */
const STICK_THRESHOLD = 200;

interface ChatMessageListProps {
  messages: ChatMessage[];
  meId?: string;
  aiActivity?: AiActivity | null;
  showScrollbar?: boolean;
}

export default function ChatMessageList({
  messages,
  meId,
  aiActivity,
  showScrollbar,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chốt chặn cuối: loại trùng theo id ngay trước khi render. Dù state thượng nguồn lỡ chứa message
  // trùng (race realtime/reload khi restart BE), key React vẫn luôn unique → hết "two children with the same key".
  const uniqueMessages = useMemo(() => {
    const byId = new Map<string, ChatMessage>();
    for (const m of messages) byId.set(m.id, m);
    return [...byId.values()];
  }, [messages]);

  /**
   * Neo đáy bằng cách ghi thẳng scrollTop của CHÍNH khung này.
   *
   * CỐ Ý không dùng scrollIntoView: nó cuộn mọi vùng cuộn tổ tiên cho tới tận
   * document, nên mỗi nhịp cập nhật của AI lại kéo cả trang nền lên một đoạn.
   * Cũng cố ý không dùng behavior "smooth": nhịp stream tới dày hơn thời gian
   * chạy animation, mỗi lần gọi lại khởi động lại animation từ đầu → khung giật
   * liên tục mà không bao giờ tới đáy.
   *
   * Chỉ neo khi người dùng đang ở gần đáy; kéo lên đọc tin cũ thì để yên.
   */
  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;

    // Tin cuối là tin MÌNH vừa gửi thì luôn nhảy đáy — đó là hành động chủ động.
    const justSent = uniqueMessages[uniqueMessages.length - 1]?.senderId === meId;

    if (!justSent && el.scrollHeight - el.scrollTop - el.clientHeight > STICK_THRESHOLD) return;

    el.scrollTop = el.scrollHeight;
  }, [uniqueMessages, aiActivity, meId]);

  if (uniqueMessages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle size={28} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Bắt đầu trò chuyện</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Nhập tin nhắn để gửi. Gõ <span className="font-semibold text-primary">@AI</span> để nhờ
            trợ lý phong thủy hỗ trợ ngay trong phòng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`flex flex-1 flex-col gap-3 bg-[#f9fafb] px-3 py-4 ${
        showScrollbar ? "overflow-y-scroll" : "overflow-y-auto scrollbar-none"
      }`}
    >
      {uniqueMessages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} isOwn={message.senderId === meId} />
      ))}
      {/* AnimatePresence để hoạt cảnh khép khe kịp chạy trước khi component bị gỡ khỏi DOM. */}
      <AnimatePresence initial={false}>
        {aiActivity && <AiActivityIndicator activity={aiActivity} />}
      </AnimatePresence>
    </div>
  );
}
