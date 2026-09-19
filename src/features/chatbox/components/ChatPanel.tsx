import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeft, Plus, Wifi, WifiOff, X, Minus } from "lucide-react";
import type { Chatbox, ChatConnectionStatus, ChatMessage } from "@/features/chatbox/types/chatbox";
import type { AiActivity } from "@/features/shared/ai-activity";
import { getChatboxDisplayName, getChatboxKindTag } from "@/features/chatbox/utils/chatUtils";
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
  const [isFocused, setIsFocused] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      ? "Trực tuyến"
      : connectionStatus === "connecting"
        ? "Đang kết nối..."
        : connectionStatus === "error"
          ? "Mất kết nối"
          : "Ngoại tuyến";
  const StatusIcon = connectionStatus === "connected" ? Wifi : WifiOff;

  const isConversation = view === "conversation" && !!activeChatboxId;
  const title = isConversation && activeBox ? getChatboxDisplayName(activeBox, meId) : "Tin nhắn";
  const kindTag = isConversation && activeBox ? getChatboxKindTag(activeBox) : null;
  // Panel consent chỉ hiện ở phòng hỗ trợ (khách là chủ phòng).
  const showConsent = isConversation && !!activeBox?.isSupport;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Tin nhắn FengDesk"
      onClick={() => setIsFocused(true)}
      onFocusCapture={() => setIsFocused(true)}
      className={`flex h-[min(460px,calc(100dvh-6rem))] w-[min(calc(100vw-1.5rem),338px)] flex-col rounded-2xl border bg-white transition-all duration-200 sm:h-[460px] sm:w-[338px] ${composerAiActive
        ? "border-primary ring-2 ring-primary/40 shadow-2xl"
        : isFocused
          ? "border-gray-300 shadow-2xl"
          : "border-gray-200 shadow-lg"
        }`}
    >
      <header
        className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 bg-white text-gray-900 transition-colors duration-200 shadow-sm rounded-t-2xl"
      >
        <div className="flex min-w-0 items-center gap-2">
          {isConversation && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full p-1.5 text-primary transition-colors hover:bg-gray-100 cursor-pointer"
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-[15px] font-bold">{title}</h2>
              {kindTag && (
                <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-600">
                  {kindTag.label}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-gray-500">
              <StatusIcon size={12} className={connectionStatus === "connected" ? "text-green-500" : ""} />
              <span>{statusLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {!isConversation && (
            <button
              type="button"
              onClick={onNewChat}
              className="rounded-full p-2 text-primary transition-colors hover:bg-gray-100 cursor-pointer"
              aria-label="Trò chuyện mới"
              title="Trò chuyện mới"
            >
              <Plus size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-primary transition-colors hover:bg-gray-100 cursor-pointer"
            aria-label="Thu nhỏ"
            title="Thu nhỏ"
          >
            <Minus size={20} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-primary transition-colors hover:bg-gray-100 cursor-pointer"
            aria-label="Đóng"
            title="Đóng"
          >
            <X size={20} />
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
