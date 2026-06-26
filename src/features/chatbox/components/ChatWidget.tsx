import { MessageCircle, X } from "lucide-react";
import { useChatbox } from "@/features/chatbox/hooks/useChatbox";
import ChatPanel from "./ChatPanel";

export default function ChatWidget() {
  const {
    user,
    meId,
    isOpen,
    view,
    chatboxes,
    messages,
    activeChatboxId,
    connectionStatus,
    unreadCount,
    isSending,
    aiActivity,
    open,
    close,
    toggle,
    openRoom,
    backToList,
    send,
    uploadImage,
    startSupport,
    newChat,
    deleteRoom,
    consentPulseRoomId,
    clearConsentPulse,
  } = useChatbox();

  return (
    <div
      className={`fixed z-40 flex flex-col items-end gap-3 ${
        isOpen
          ? "bottom-0 right-[max(1rem,env(safe-area-inset-right))]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]"
      }`}
    >
      {isOpen && user && (
        <ChatPanel
          view={view}
          chatboxes={chatboxes}
          messages={messages}
          activeChatboxId={activeChatboxId}
          connectionStatus={connectionStatus}
          isSending={isSending}
          aiActivity={aiActivity}
          meId={meId}
          onClose={close}
          onOpenRoom={openRoom}
          onBack={backToList}
          onSend={send}
          onUpload={uploadImage}
          onStartSupport={startSupport}
          onNewChat={newChat}
          onDeleteRoom={deleteRoom}
          consentPulseRoomId={consentPulseRoomId}
          onClearConsentPulse={clearConsentPulse}
        />
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={open}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary-dark active:scale-95 cursor-pointer"
          aria-label="Mở tin nhắn"
          aria-expanded={isOpen}
        >
          {/* Pulse vòng tròn khi có tin chưa đọc — cùng kiểu nháy của panel consent khi nhân viên join phòng. */}
          {unreadCount > 0 && (
            <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/60 animate-ping" />
          )}

          <MessageCircle size={26} strokeWidth={1.8} />

          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white tabular-nums ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}

          <span className="pointer-events-none absolute -top-10 right-0 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            Tin nhắn
          </span>
        </button>
      )}
    </div>
  );
}
