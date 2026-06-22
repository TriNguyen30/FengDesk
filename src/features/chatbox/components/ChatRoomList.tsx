import { Headphones, MessageCircle, Users } from "lucide-react";
import type { Chatbox } from "@/features/chatbox/types/chatbox";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import {
  formatMessageTime,
  getChatboxDisplayName,
  getLastMessagePreview,
} from "@/features/chatbox/utils/chatUtils";

interface ChatRoomListProps {
  chatboxes: Chatbox[];
  meId?: string;
  onOpenRoom: (chatboxId: string) => void;
  onStartSupport: () => void;
  onDeleteRoom: (chatboxId: string) => void;
}

export default function ChatRoomList({
  chatboxes,
  meId,
  onOpenRoom,
  onStartSupport,
  onDeleteRoom,
}: ChatRoomListProps) {
  if (chatboxes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle size={28} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-gray-800">Chưa có cuộc trò chuyện</p>
        <p className="text-xs leading-relaxed text-gray-500">
          Bắt đầu trò chuyện với đội ngũ hỗ trợ FengDesk — nhân viên sẽ vào hỗ trợ bạn ngay khi
          có thể.
        </p>
        <button
          type="button"
          onClick={onStartSupport}
          className="mt-1 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark cursor-pointer"
        >
          <Headphones size={16} />
          Bắt đầu trò chuyện
        </button>
      </div>
    );
  }

  return (
    <div className="scrollbar-none flex flex-1 flex-col overflow-y-auto py-1">
      {chatboxes.map((box) => (
        <div
          key={box.id}
          className={`group flex items-center pr-2 transition-colors hover:bg-gray-50 ${
            box.isClosed ? "opacity-60" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => onOpenRoom(box.id)}
            className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left cursor-pointer"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {box.isGroup ? <Users size={18} /> : <MessageCircle size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-gray-800">
                  <span className="truncate">{getChatboxDisplayName(box, meId)}</span>
                  {box.isClosed && (
                    <span className="shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
                      đã đóng
                    </span>
                  )}
                </p>
                {box.lastMessage && (
                  <span className="shrink-0 text-[10px] text-gray-400 tabular-nums">
                    {formatMessageTime(box.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-gray-500">{getLastMessagePreview(box)}</p>
            </div>
          </button>
          {!box.isClosed && (
            <ConfirmDeleteButton
              onConfirm={() => onDeleteRoom(box.id)}
              label="Xóa hội thoại"
              className="ml-1"
            />
          )}
        </div>
      ))}
    </div>
  );
}
