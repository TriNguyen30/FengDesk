const GUEST_SESSION_KEY = "fengdesk_chat_guest_id";

export function getGuestSessionId(): string {
  const existing = localStorage.getItem(GUEST_SESSION_KEY);
  if (existing) return existing;

  const id = `guest_${crypto.randomUUID()}`;
  localStorage.setItem(GUEST_SESSION_KEY, id);
  return id;
}

export function getChatRoomId(userId?: string | null): string {
  return userId ?? getGuestSessionId();
}

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
