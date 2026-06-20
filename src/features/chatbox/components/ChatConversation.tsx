import { useState } from "react";
import { Bot, Lock } from "lucide-react";
import type { AiActivity, ChatMessage } from "@/features/chatbox/types/chatbox";
import type { UploadFn } from "@/features/chatbox/hooks/useImageAttachments";
import ChatInput from "./ChatInput";
import ChatMessageList from "./ChatMessageList";

interface ChatConversationProps {
  messages: ChatMessage[];
  meId?: string;
  aiActivity: AiActivity | null;
  isSending: boolean;
  isClosed?: boolean;
  onSend: (content: string, imageUrls: string[]) => void;
  onUpload: UploadFn;
}

/**
 * Thân cuộc trò chuyện. Được render kèm key={chatboxId} ở ChatPanel nên khi đổi phòng
 * component remount → ô nháp tự reset (không cần setState trong effect).
 */
export default function ChatConversation({
  messages,
  meId,
  aiActivity,
  isSending,
  isClosed = false,
  onSend,
  onUpload,
}: ChatConversationProps) {
  const [draft, setDraft] = useState("");

  const askAi = () =>
    setDraft((prev) => (prev.trimStart().toLowerCase().startsWith("@ai") ? prev : `@AI ${prev}`));

  return (
    <>
      <ChatMessageList messages={messages} meId={meId} aiActivity={aiActivity} />

      {isClosed ? (
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-3 text-xs text-gray-400">
          <Lock size={13} />
          Cuộc trò chuyện đã đóng — không thể gửi tin mới.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between border-t border-gray-100 px-3 pt-2">
            <span className="text-[10px] text-gray-400">Cần tư vấn nhanh?</span>
            <button
              type="button"
              onClick={askAi}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20 cursor-pointer"
            >
              <Bot size={13} />
              Hỏi trợ lý AI
            </button>
          </div>

          <ChatInput
            value={draft}
            onChange={setDraft}
            onSubmit={onSend}
            onUpload={onUpload}
            isSending={isSending}
            placeholder="@AI để hỏi trợ lý..."
          />
        </>
      )}
    </>
  );
}
