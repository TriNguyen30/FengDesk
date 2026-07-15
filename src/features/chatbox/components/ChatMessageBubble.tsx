import type { ChatMessage } from "@/features/chatbox/types/chatbox";
import { formatMessageTime } from "@/features/chatbox/utils/chatUtils";
import { Bot, User } from "lucide-react";
import Markdown from "./Markdown";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export default function ChatMessageBubble({ message, isOwn }: ChatMessageBubbleProps) {
  const isAi = message.senderType === "AiBot";
  const isSystem = message.senderType === "System";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-500">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
              {isAi ? <Bot size={14} /> : <User size={14} />}
            </span>
            <span className="text-[11px] font-medium text-gray-500">
              {isAi ? "Trợ lý AI" : (message.senderName ?? "Người dùng")}
            </span>
          </div>
        )}

        {message.images?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.images.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt="Ảnh đính kèm"
                  className="max-h-44 rounded-xl border border-gray-200 object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {message.content?.trim() && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${isOwn
                ? "rounded-br-md bg-primary text-white"
                : isAi
                  ? "rounded-bl-md border border-primary/15 bg-primary/5 text-gray-800"
                  : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
              }`}
          >
            {isAi ? (
              <Markdown text={message.content} />
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
        )}

        <span className="px-1 text-[10px] text-gray-400 tabular-nums">
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
