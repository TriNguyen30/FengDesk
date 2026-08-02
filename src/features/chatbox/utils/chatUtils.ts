import type { Chatbox } from "@/features/chatbox/types/chatbox";
import notificationSoundFile from "@/assets/sound/NotificationSound.mp3";

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

/** Nhãn loại phòng cạnh tên: phòng gắn 1 shop → "Store", phòng hỗ trợ nền tảng → "Support". */
export function getChatboxKindTag(
  box: Chatbox,
): { label: string; tone: "store" | "support" } | null {
  if (box.gardenStoreId) return { label: "Store", tone: "store" };
  if (box.isSupport) return { label: "Support", tone: "support" };
  return null;
}

/** Tóm tắt tin gần nhất cho danh sách phòng. */
export function getLastMessagePreview(box: Chatbox): string {
  const last = box.lastMessage;
  if (!last) return "Chưa có tin nhắn";
  if (last.content?.trim()) return last.content.trim();
  if (last.images?.length) return "📷 Hình ảnh";
  return "...";
}

/** Hiển thị thông báo trình duyệt (Chrome Notification) nếu tab không focus. */
export function showBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (!("Notification" in window)) return;
  
  if (document.hasFocus()) return; // Không hiển thị notification OS nếu user đang xem tab

  const show = () => {
    const notification = new Notification(title, { body, icon: "/favicon.ico" });
    notification.onclick = () => {
      window.focus();
      onClick?.();
    };
  };

  if (Notification.permission === "granted") {
    show();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        show();
      }
    });
  }
}

/** Phát âm thanh thông báo khi có tin nhắn mới. */
export function playNotificationSound() {
  const audio = new Audio(notificationSoundFile);
  audio.play().catch((err) => {
    console.warn("Không thể phát âm thanh thông báo (có thể do trình duyệt chặn autoplay):", err);
  });
}
