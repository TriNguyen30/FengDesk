import { useEffect, useMemo, useRef } from "react";
import { MessageCircle } from "lucide-react";
import type { AiActivity, ChatMessage } from "@/features/chatbox/types/chatbox";
import ChatMessageBubble from "./ChatMessageBubble";
import AiActivityIndicator from "./AiActivityIndicator";

interface ChatMessageListProps {
  messages: ChatMessage[];
  meId?: string;
  aiActivity?: AiActivity | null;
}

export default function ChatMessageList({ messages, meId, aiActivity }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Chốt chặn cuối: loại trùng theo id ngay trước khi render. Dù state thượng nguồn lỡ chứa message
  // trùng (race realtime/reload khi restart BE), key React vẫn luôn unique → hết "two children with the same key".
  const uniqueMessages = useMemo(() => {
    const byId = new Map<string, ChatMessage>();
    for (const m of messages) byId.set(m.id, m);
    return [...byId.values()];
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uniqueMessages, aiActivity]);

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
    <div className="scrollbar-none flex flex-1 flex-col gap-3 overflow-y-auto bg-[#f9fafb] px-3 py-4">
      {uniqueMessages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} isOwn={message.senderId === meId} />
      ))}
      {aiActivity && <AiActivityIndicator activity={aiActivity} />}
      <div ref={bottomRef} />
    </div>
  );
}
