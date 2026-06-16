import { useEffect } from "react";
import { Minus, Wifi, WifiOff, X } from "lucide-react";
import type { ChatConnectionStatus, ChatMessage } from "@/features/chatbox/types/chatbox";
import ChatInput from "./ChatInput";
import ChatMessageList from "./ChatMessageList";

interface ChatPanelProps {
  onClose: () => void;
  messages: ChatMessage[];
  connectionStatus: ChatConnectionStatus;
  isSending: boolean;
  isRealtime: boolean;
  currentUserId?: string;
  onSend: (content: string) => void;
}

export default function ChatPanel({
  onClose,
  messages,
  connectionStatus,
  isSending,
  isRealtime,
  currentUserId,
  onSend,
}: ChatPanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const statusLabel =
    connectionStatus === "connected"
      ? isRealtime
        ? "Đang kết nối realtime"
        : "Đang hoạt động"
      : connectionStatus === "connecting"
        ? "Đang kết nối..."
        : connectionStatus === "error"
          ? "Mất kết nối"
          : "Ngắt kết nối";

  const StatusIcon = connectionStatus === "connected" ? Wifi : WifiOff;

  return (
    <div
      role="dialog"
      aria-label="Chat hỗ trợ FengDesk"
      className="flex h-[min(32rem,calc(100dvh-6rem))] w-[min(calc(100vw-1.5rem),24rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:h-[28rem] sm:w-96"
    >
      <header className="flex items-center justify-between border-b border-gray-100 bg-linear-to-r from-primary to-primary-dark px-4 py-3 text-white">
        <div className="min-w-0">
          <h2 className="text-sm font-bold">FengDesk Support</h2>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/85">
            <StatusIcon size={12} />
            <span>{statusLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15 cursor-pointer"
            aria-label="Thu nhỏ"
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15 cursor-pointer"
            aria-label="Đóng chat"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <ChatMessageList messages={messages} currentUserId={currentUserId} />

      <ChatInput
        onSend={onSend}
        isSending={isSending}
        disabled={!currentUserId}
        placeholder={currentUserId ? "Nhập tin nhắn..." : "Đăng nhập để bắt đầu chat"}
      />
    </div>
  );
}
