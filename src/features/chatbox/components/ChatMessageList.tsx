import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/features/chatbox/types/chatbox";
import ChatMessageBubble from "./ChatMessageBubble";
import { MessageCircle } from "lucide-react";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
}

export default function ChatMessageList({ messages, currentUserId }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle size={28} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Xin chào từ FengDesk!</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Hỏi về cây phong thủy, đơn hàng hoặc tư vấn không gian làm việc. Chúng tôi phản hồi
            ngay lập tức.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollbar-none flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
      {messages.map((message) => (
        <ChatMessageBubble
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
