import type { ChatMessage } from "@/features/chatbox/types/chatbox";
import { formatMessageTime } from "@/features/chatbox/utils/chatUtils";
import { Bot, User } from "lucide-react";
import Markdown from "./Markdown";
import PaymentAttachment from "./PaymentAttachment";
import { extractPaymentBlock } from "@/features/chatbox/utils/paymentBlock";
import Tooltip from "@/components/ui/Tooltip";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export default function ChatMessageBubble({ message, isOwn }: ChatMessageBubbleProps) {
  const isAi = message.senderType === "AiBot";
  const isSystem = message.senderType === "System";
  // Tin AI có thể kèm block thanh toán (confirm_order) — tách ra render card riêng dưới bubble.
  const { text: aiText, payment } = isAi
    ? extractPaymentBlock(message.content ?? "")
    : { text: message.content ?? "", payment: null };

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
    <div className={`flex flex-col w-full mb-2 ${isOwn ? "items-end" : "items-start"}`}>
      <div
        className={`flex max-w-[75%] gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} items-end`}
      >
        {!isOwn && (
          <Tooltip
            content={isAi ? "Trợ lý AI" : (message.senderName ?? "Người dùng")}
            position="left"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 mb-0.5">
              {isAi ? <Bot size={16} /> : <User size={16} />}
            </span>
          </Tooltip>
        )}

        <Tooltip content={formatMessageTime(message.createdAt)} position={isOwn ? "left" : "right"}>
          <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
            {message.images?.length > 0 && (
              <div className={`flex flex-wrap gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                {message.images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt="Ảnh đính kèm"
                      className="max-h-44 rounded-2xl object-cover"
                    />
                  </a>
                ))}
              </div>
            )}

            {aiText.trim() && (
              <div
                className={`px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                  isOwn
                    ? "bg-primary text-white rounded-[18px] rounded-br-[4px]"
                    : "bg-[#e4e6eb] text-gray-900 rounded-[18px] rounded-bl-[4px]"
                }`}
              >
                {isAi ? (
                  <Markdown text={aiText} />
                ) : (
                  <p className="whitespace-pre-wrap break-words">{aiText}</p>
                )}
              </div>
            )}

            {payment && <PaymentAttachment payment={payment} />}
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
