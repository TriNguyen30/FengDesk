import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { chatApi, type AiChatTurn } from "@/features/chatbox/api/chat.api";
import { chatHub } from "@/features/chatbox/lib/chatHub";
import type { AiActivity, ChatMessage } from "@/features/chatbox/types/chatbox";

export interface AiMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  images: string[];
}

function mapHistory(history: AiChatTurn[]): AiMessage[] {
  return history.map((t, i) => ({
    id: `h-${i}-${t.role}`,
    role: t.role === "AiBot" ? "ai" : t.role === "System" ? "system" : "user",
    content: t.content ?? "",
    images: t.images ?? [],
  }));
}

/** Map tin từ REST (ChatMessage, mới→cũ) → AiMessage hiển thị (cũ→mới). */
function mapMessages(items: ChatMessage[]): AiMessage[] {
  return [...items]
    .reverse()
    .map((m) => ({
      id: m.id,
      role: m.senderType === "AiBot" ? "ai" : m.senderType === "System" ? "system" : "user",
      content: m.content ?? "",
      images: m.images ?? [],
    }));
}

/** Hội thoại với trợ lý AI (trang lớn). Đồng bộ qua REST; aiStatus realtime qua SignalR. */
export function useAiChat(productId?: string) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [chatboxId, setChatboxId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [activity, setActivity] = useState<AiActivity | null>(null);

  const chatboxRef = useRef<string | null>(null);
  useEffect(() => {
    chatboxRef.current = chatboxId;
  }, [chatboxId]);

  // Đảm bảo chỉ nạp lịch sử 1 lần (lần mở đầu). clearConversation reset cờ này.
  const loadedRef = useRef(false);

  // Nạp lại hội thoại AI đã lưu (gọi khi mở khung lớn) → hội thoại "ở lại" khung lớn sau reload,
  // thay vì nhảy xuống widget nhỏ.
  const loadHistory = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const ensure = await chatApi.ensureAiChatbox(productId);
      if (!ensure.data.isSuccess) {
        loadedRef.current = false;
        return;
      }
      const id = ensure.data.data.id;
      setChatboxId(id);
      const res = await chatApi.getMessages(id);
      if (res.data.isSuccess) setMessages(mapMessages(res.data.data.items));
    } catch {
      loadedRef.current = false;
    }
  }, [productId]);

  // Clear hội thoại (soft delete ở BE) rồi reset khung → lượt gửi sau tạo phòng AI mới.
  const clearConversation = useCallback(async () => {
    const id = chatboxRef.current;
    if (id) {
      try {
        await chatApi.deleteChatbox(id);
      } catch {
        /* best-effort: vẫn reset UI dù xóa lỗi */
      }
    }
    setChatboxId(null);
    setMessages([]);
    loadedRef.current = false;
  }, []);

  // Lắng nghe trạng thái AI realtime (best-effort).
  useEffect(() => {
    let cancelled = false;
    const onStatus = (a: AiActivity) => {
      if (a.chatboxId === chatboxRef.current) setActivity(a.phase === "done" ? null : a);
    };
    (async () => {
      try {
        await chatHub.connect();
        if (!cancelled) chatHub.on<AiActivity>("aiStatus", onStatus);
      } catch {
        /* realtime hỏng không chặn chat (POST vẫn chạy) */
      }
    })();
    return () => {
      cancelled = true;
      chatHub.off("aiStatus", onStatus as (...a: unknown[]) => void);
    };
  }, []);

  // Biết chatboxId → join group để nhận aiStatus cho các lượt sau.
  useEffect(() => {
    if (chatboxId) void chatHub.joinChatbox(chatboxId).catch(() => {});
  }, [chatboxId]);

  const send = useCallback(
    async (text: string, imageUrls?: string[]) => {
      const t = text.trim();
      if ((!t && !(imageUrls && imageUrls.length)) || sending) return;

      setMessages((p) => [
        ...p,
        { id: `u-${Date.now()}`, role: "user", content: t, images: imageUrls ?? [] },
      ]);
      setSending(true);
      setActivity({ chatboxId: chatboxRef.current ?? "", phase: "thinking" });
      try {
        const res = await chatApi.sendToAi({
          message: t || undefined,
          chatboxId: chatboxRef.current ?? undefined,
          productId,
          imageUrls,
        });
        if (res.data.isSuccess) {
          setChatboxId(res.data.data.chatboxId);
          setMessages(mapHistory(res.data.data.history));
        } else {
          toast.error(res.data.message || "Trợ lý AI không phản hồi.");
        }
      } catch {
        toast.error("Không kết nối được trợ lý AI. Thử lại sau.");
      } finally {
        setSending(false);
        setActivity(null);
      }
    },
    [sending, productId],
  );

  // Upload 1 ảnh cho trang AI lớn: lượt đầu chưa có chatbox → ensure trước (endpoint upload cần chatboxId).
  // Chỉ trả link; composer gắn vào imageUrls rồi gửi cùng nội dung. signal để hủy khi quá chậm.
  const uploadImage = useCallback(
    async (file: File, signal: AbortSignal): Promise<string> => {
      let roomId = chatboxRef.current;
      if (!roomId) {
        const ensure = await chatApi.ensureAiChatbox(productId);
        if (!ensure.data.isSuccess) throw new Error("ensure-failed");
        roomId = ensure.data.data.id;
        setChatboxId(roomId);
      }
      const up = await chatApi.uploadImage(roomId, file, signal);
      if (!up.data.isSuccess) throw new Error(up.data.message || "upload-failed");
      return up.data.data;
    },
    [productId],
  );

  return { messages, sending, activity, send, uploadImage, loadHistory, clearConversation };
}
