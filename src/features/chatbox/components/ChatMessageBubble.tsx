import type { ChatMessage } from "@/features/chatbox/types/chatbox";
import { formatMessageTime } from "@/features/chatbox/utils/chatUtils";
import { Bot, Headphones, User } from "lucide-react";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function SenderIcon({ role }: { role: ChatMessage["senderRole"] }) {
  if (role === "bot") return <Bot size={14} />;
  if (role === "staff") return <Headphones size={14} />;
  return <User size={14} />;
}

export default function ChatMessageBubble({ message, isOwn }: ChatMessageBubbleProps) {
  const isSupport = message.senderRole === "bot" || message.senderRole === "staff";

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[85%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
      >
        {!isOwn && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
              <SenderIcon role={message.senderRole} />
            </span>
            <span className="text-[11px] font-medium text-gray-500">{message.senderName}</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
            isOwn
              ? "rounded-br-md bg-primary text-white"
              : isSupport
                ? "rounded-bl-md border border-primary/15 bg-primary/5 text-gray-800"
                : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="px-1 text-[10px] text-gray-400 tabular-nums">
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
