import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { chatApi, type AiChatTurn } from "@/features/chatbox/api/chat.api";
import { chatHub } from "@/features/chatbox/lib/chatHub";
import type { AiActivity } from "@/features/chatbox/types/chatbox";

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

  return { messages, sending, activity, send };
}
