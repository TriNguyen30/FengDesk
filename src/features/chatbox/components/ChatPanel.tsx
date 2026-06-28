import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Wifi, WifiOff, X } from "lucide-react";
import type {
  AiActivity,
  Chatbox,
  ChatConnectionStatus,
  ChatMessage,
} from "@/features/chatbox/types/chatbox";
import { getChatboxDisplayName } from "@/features/chatbox/utils/chatUtils";
import type { UploadFn } from "@/features/chatbox/hooks/useImageAttachments";
import ChatConversation from "./ChatConversation";
import ChatRoomList from "./ChatRoomList";
import ConsentPanel from "./ConsentPanel";

interface ChatPanelProps {
  view: "list" | "conversation";
  chatboxes: Chatbox[];
  messages: ChatMessage[];
  activeChatboxId: string | null;
  connectionStatus: ChatConnectionStatus;
  isSending: boolean;
  aiActivity: AiActivity | null;
  meId?: string;
  onClose: () => void;
  onOpenRoom: (id: string) => void;
  onBack: () => void;
  onSend: (content: string, imageUrls: string[]) => void;
  onUpload: UploadFn;
  onStartSupport: () => void;
  onNewChat: () => void;
  onDeleteRoom: (chatboxId: string) => void;
  consentPulseRoomId: string | null;
  onClearConsentPulse: () => void;
}

export default function ChatPanel({
  view,
  chatboxes,
  messages,
  activeChatboxId,
  connectionStatus,
  isSending,
  aiActivity,
  meId,
  onClose,
  onOpenRoom,
  onBack,
  onSend,
  onUpload,
  onStartSupport,
  onNewChat,
  onDeleteRoom,
  consentPulseRoomId,
  onClearConsentPulse,
}: ChatPanelProps) {
  // @AI đang được gõ trong ô nhập → sáng viền KHUNG CHAT (thay cho hộp viền quanh ô nhập).
  const [composerAiActive, setComposerAiActive] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const activeBox = useMemo(
    () => chatboxes.find((c) => c.id === activeChatboxId),
    [chatboxes, activeChatboxId],
  );

  const statusLabel =
    connectionStatus === "connected"
      ? "Đang kết nối"
      : connectionStatus === "connecting"
        ? "Đang kết nối..."
        : connectionStatus === "error"
          ? "Mất kết nối"
          : "Ngoại tuyến";
  const StatusIcon = connectionStatus === "connected" ? Wifi : WifiOff;

  const isConversation = view === "conversation" && !!activeChatboxId;
  const title = isConversation && activeBox ? getChatboxDisplayName(activeBox, meId) : "Tin nhắn";
  // Panel consent chỉ hiện ở phòng hỗ trợ (khách là chủ phòng).
  const showConsent = isConversation && !!activeBox?.isSupport;

  return (
    <div
      role="dialog"
      aria-label="Tin nhắn FengDesk"
      className={`flex h-[min(36rem,calc(100dvh-8rem))] w-[min(calc(100vw-1.5rem),24rem)] flex-col overflow-hidden rounded-t-2xl border-x border-t bg-white shadow-2xl transition-all sm:h-[min(38rem,calc(100dvh-8rem))] sm:w-96 ${
        composerAiActive ? "border-primary ring-2 ring-primary/40" : "border-gray-200"
      }`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-gray-100 bg-primary px-3 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          {isConversation && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15 cursor-pointer"
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold">{title}</h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/85">
              <StatusIcon size={12} />
              <span>{statusLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isConversation && (
            <button
              type="button"
              onClick={onNewChat}
              className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15 cursor-pointer"
              aria-label="Trò chuyện mới"
              title="Trò chuyện mới"
            >
              <Plus size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15 cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {isConversation ? (
        <>
          {showConsent && activeChatboxId && (
            <ConsentPanel
              key={`consent-${activeChatboxId}`}
              chatboxId={activeChatboxId}
              pulse={consentPulseRoomId === activeChatboxId}
              onInteract={onClearConsentPulse}
            />
          )}
          <ChatConversation
            key={`conv-${activeChatboxId}`}
            messages={messages}
            meId={meId}
            aiActivity={aiActivity}
            isSending={isSending}
            isClosed={!!activeBox?.isClosed}
            onSend={onSend}
            onUpload={onUpload}
            onAiActiveChange={setComposerAiActive}
          />
        </>
      ) : (
        <ChatRoomList
          chatboxes={chatboxes}
          meId={meId}
          onOpenRoom={onOpenRoom}
          onStartSupport={onStartSupport}
          onDeleteRoom={onDeleteRoom}
        />
      )}
    </div>
  );
}
