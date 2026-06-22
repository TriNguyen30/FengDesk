import { useState } from "react";
import { Headphones, Inbox, MessageCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useStaffSupport } from "@/features/chatbox/hooks/useStaffSupport";
import ChatMessageList from "@/features/chatbox/components/ChatMessageList";
import ChatInput from "@/features/chatbox/components/ChatInput";
import { formatMessageTime, getLastMessagePreview } from "@/features/chatbox/utils/chatUtils";
import type { Chatbox } from "@/features/chatbox/types/chatbox";

function customerName(box: Chatbox): string {
  const last = box.lastMessage;
  if (last?.senderName && last.senderType === "User") return last.senderName;
  return "Khách hàng";
}

export default function StaffSupportPage() {
  const {
    meId,
    queue,
    myRooms,
    activeId,
    messages,
    status,
    sending,
    claiming,
    refresh,
    openRoom,
    claim,
    send,
  } = useStaffSupport();
  const [draft, setDraft] = useState("");

  const active = [...myRooms, ...queue].find((r) => r.id === activeId) ?? null;

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    send(t);
    setDraft("");
  };

  const StatusIcon = status === "connected" ? Wifi : WifiOff;
  const statusText =
    status === "connected"
      ? "Trực tuyến"
      : status === "connecting"
        ? "Đang kết nối..."
        : "Mất kết nối realtime";

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Cột trái: hàng đợi + đang hỗ trợ */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Hỗ trợ khách hàng</h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400">
              <StatusIcon size={12} />
              <span>{statusText}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
            aria-label="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Hàng đợi */}
          <div className="px-3 pt-3">
            <p className="flex items-center gap-1.5 px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
              <Inbox size={12} /> Hàng đợi ({queue.length})
            </p>
            {queue.length === 0 ? (
              <p className="px-1 pb-2 text-xs text-gray-400">Không có khách đang chờ.</p>
            ) : (
              queue.map((box) => (
                <div
                  key={box.id}
                  className="mb-1 rounded-lg border border-amber-100 bg-amber-50/50 p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-gray-800">
                      {customerName(box)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Đang chờ
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {getLastMessagePreview(box)}
                  </p>
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={() => void claim(box.id)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
                  >
                    <Headphones size={13} />
                    Nhận hỗ trợ
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Đang hỗ trợ */}
          <div className="px-3 pt-3 pb-2">
            <p className="flex items-center gap-1.5 px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <MessageCircle size={12} /> Đang hỗ trợ ({myRooms.length})
            </p>
            {myRooms.length === 0 ? (
              <p className="px-1 text-xs text-gray-400">Chưa nhận phòng nào.</p>
            ) : (
              myRooms.map((box) => {
                const isActive = box.id === activeId;
                return (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => void openRoom(box.id)}
                    className={`mb-1 flex w-full flex-col rounded-lg p-2.5 text-left transition-colors cursor-pointer ${
                      isActive ? "bg-primary/10" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-800">
                        {customerName(box)}
                      </span>
                      {box.lastMessage && (
                        <span className="shrink-0 text-[10px] text-gray-400 tabular-nums">
                          {formatMessageTime(box.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {getLastMessagePreview(box)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Cột phải: hội thoại — viền sáng xanh khi đang soạn @AI (đồng bộ với widget). */}
      <div
        className={`flex flex-1 flex-col overflow-hidden rounded-xl border bg-white transition-all ${
          /(^|\s)@ai\b/i.test(draft) ? "border-primary ring-2 ring-primary/40" : "border-gray-200"
        }`}
      >
        {active ? (
          <>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">{customerName(active)}</h3>
              <p className="text-[11px] text-gray-400">Phòng hỗ trợ · {active.id.slice(0, 8)}</p>
            </div>
            <ChatMessageList messages={messages} meId={meId} />
            <ChatInput
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              isSending={sending}
              placeholder="Trả lời khách hàng... (@AI để nhờ trợ lý)"
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Headphones size={28} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-gray-800">Chọn một cuộc trò chuyện</p>
            <p className="max-w-xs text-xs leading-relaxed text-gray-500">
              Nhận một khách đang chờ ở hàng đợi, hoặc mở một phòng bạn đang hỗ trợ để trả lời.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
