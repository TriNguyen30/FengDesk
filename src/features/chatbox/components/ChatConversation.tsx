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
  /** Báo @AI đang bật lên panel để sáng viền khung chat. */
  onAiActiveChange?: (active: boolean) => void;
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
  onAiActiveChange,
}: ChatConversationProps) {
  const [draft, setDraft] = useState("");

  // Toggle @AI: chưa có → thêm tiền tố "@AI "; đang bật (bắt đầu bằng @AI) → gỡ ra để TẮT.
  const askAi = () =>
    setDraft((prev) => {
      const trimmed = prev.replace(/^\s+/, "");
      return /^@ai\b/i.test(trimmed) ? trimmed.replace(/^@ai\b[ \t]*/i, "") : `@AI ${prev}`;
    });

  const aiOn = /^\s*@ai\b/i.test(draft);

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
              aria-pressed={aiOn}
              title={aiOn ? "Bấm lần nữa để tắt @AI" : "Thêm @AI để hỏi trợ lý"}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                aiOn
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              <Bot size={13} />
              {aiOn ? "Đang hỏi AI" : "Hỏi trợ lý AI"}
            </button>
          </div>

          <ChatInput
            value={draft}
            onChange={setDraft}
            onSubmit={onSend}
            onUpload={onUpload}
            onAiActiveChange={onAiActiveChange}
            isSending={isSending}
            placeholder="@AI để hỏi trợ lý..."
          />
        </>
      )}
    </>
  );
}
