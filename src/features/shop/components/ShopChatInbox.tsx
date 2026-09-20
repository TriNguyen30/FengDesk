import { useState, useRef, useEffect } from "react";
import {
  Headphones,
  Inbox,
  MessageCircle,
  RefreshCw,
  User,
  Wifi,
  WifiOff,
  EllipsisVertical,
  Trash2,
} from "lucide-react";
import { useShopChatSupport } from "../hooks/useShopChatSupport";
import ChatMessageList from "@/features/chatbox/components/ChatMessageList";
import ChatInput from "@/features/chatbox/components/ChatInput";
import { formatMessageTime, getLastMessagePreview } from "@/features/chatbox/utils/chatUtils";
import { chatApi } from "@/features/chatbox/api/chat.api";
import type { Chatbox } from "@/features/chatbox/types/chatbox";
import Modal from "@/components/ui/Modal";

function customerName(box: Chatbox): string {
  if (box.title?.trim()) return box.title.trim();
  const last = box.lastMessage;
  if (last?.senderName && last.senderType === "User") return last.senderName;
  return "Khách hàng";
}

interface ShopChatInboxProps {
  storeId: string;
}

/**
 * Hộp thư khách hàng của MỘT store — garden owner/staff nhận & trả lời tin nhắn khách gửi cho shop.
 * Cùng cơ chế claim-queue với StaffSupportPage (hỗ trợ nền tảng) nhưng scoped theo storeId.
 */
export function ShopChatInbox({ storeId }: ShopChatInboxProps) {
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
    deleteRoom,
  } = useShopChatSupport(storeId);
  const [draft, setDraft] = useState("");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const active = [...myRooms, ...queue].find((r) => r.id === activeId) ?? null;

  const submit = (content: string, imageUrls: string[]) => {
    if (!content.trim() && imageUrls.length === 0) return;
    send(content, imageUrls);
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
    <>
      <div className="flex h-[560px] gap-4">
        {/* Cột trái: hàng đợi + đang hỗ trợ */}
        <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Hộp thư khách hàng</h2>
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

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700">
                          <User size={14} />
                        </span>
                        <span className="truncate text-sm font-medium text-gray-800">
                          {customerName(box)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Đang chờ
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {getLastMessagePreview(box, meId)}
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
                <p className="px-1 text-xs text-gray-400">Chưa nhận cuộc trò chuyện nào.</p>
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
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User size={14} />
                          </span>
                          <span className="truncate text-sm font-medium text-gray-800">
                            {customerName(box)}
                          </span>
                        </div>
                        {box.lastMessage && (
                          <span className="shrink-0 text-[10px] text-gray-400 tabular-nums">
                            {formatMessageTime(box.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p
                          className={`truncate text-xs ${
                            box.unreadCount > 0 ? "font-semibold text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {getLastMessagePreview(box, meId)}
                        </p>
                        {box.unreadCount > 0 && (
                          <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white tabular-nums">
                            {box.unreadCount > 9 ? "9+" : box.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Cột phải: hội thoại */}
        <div
          className={`flex flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
            /(^|\s)@ai\b/i.test(draft) ? "border-primary ring-2 ring-primary/40" : "border-gray-100"
          }`}
        >
          {active ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{customerName(active)}</h3>
                  <p className="text-[11px] text-gray-400">
                    Hộp thư shop · {active.id.slice(0, 8)}
                  </p>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((p) => !p)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                    aria-label="Tùy chọn"
                  >
                    <EllipsisVertical size={18} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          setDeleteModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                      >
                        <Trash2 size={16} />
                        Xóa đoạn chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <ChatMessageList messages={messages} meId={meId} showScrollbar />
              <ChatInput
                value={draft}
                onChange={setDraft}
                onSubmit={submit}
                isSending={sending}
                placeholder="Trả lời khách hàng... (@AI để nhờ trợ lý)"
                onUpload={
                  active
                    ? async (file) => {
                        const res = await chatApi.uploadImage(active.id, file);
                        if (res.data.isSuccess) return res.data.data;
                        throw new Error(res.data.message || "Lỗi tải ảnh");
                      }
                    : undefined
                }
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Headphones size={28} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-gray-800">Chọn một cuộc trò chuyện</p>
              <p className="max-w-xs text-xs leading-relaxed text-gray-500">
                Nhận một khách đang chờ ở hàng đợi, hoặc mở một cuộc trò chuyện bạn đang hỗ trợ để
                trả lời.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Xóa cuộc trò chuyện"
      >
        <p className="text-sm text-gray-600">
          Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteModalOpen(false)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              if (active) void deleteRoom(active.id);
              setDeleteModalOpen(false);
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            Xóa
          </button>
        </div>
      </Modal>
    </>
  );
}
