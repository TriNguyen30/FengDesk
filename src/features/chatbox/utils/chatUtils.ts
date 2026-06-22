import type { Chatbox } from "@/features/chatbox/types/chatbox";

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tên hiển thị của phòng (chưa có tên user trong participants → suy từ tin gần nhất). */
export function getChatboxDisplayName(box: Chatbox, meId?: string): string {
  if (box.title?.trim()) return box.title.trim();
  if (box.isGroup) return "Nhóm trò chuyện";
  const last = box.lastMessage;
  if (last?.senderName && last.senderId !== meId) return last.senderName;
  return "Cuộc trò chuyện";
}

/** Tóm tắt tin gần nhất cho danh sách phòng. */
export function getLastMessagePreview(box: Chatbox): string {
  const last = box.lastMessage;
  if (!last) return "Chưa có tin nhắn";
  if (last.content?.trim()) return last.content.trim();
  if (last.images?.length) return "📷 Hình ảnh";
  return "...";
}
