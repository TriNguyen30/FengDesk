import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { chatApi, type AiChatTurn } from "@/features/chatbox/api/chat.api";
import { useAiActivity } from "@/features/shared/ai-activity";
import type { ChatMessage } from "@/features/chatbox/types/chatbox";

export interface AiMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  images: string[];
}

function mapHistory(history: AiChatTurn[]): AiMessage[] {
  return history.map((t) => ({
    id: t.id,
    role: t.role === "AiBot" ? "ai" : t.role === "System" ? "system" : "user",
    content: t.content ?? "",
    images: t.images ?? [],
  }));
}

/** Map tin từ REST (ChatMessage, mới→cũ) → AiMessage hiển thị (cũ→mới). */
function mapMessages(items: ChatMessage[]): AiMessage[] {
  return [...items].reverse().map((m) => ({
    id: m.id,
    role: m.senderType === "AiBot" ? "ai" : m.senderType === "System" ? "system" : "user",
    content: m.content ?? "",
    images: m.images ?? [],
  }));
}

/** Số tin nạp mỗi trang (mặc định + mỗi lần kéo lên trên cùng nạp thêm bấy nhiêu). */
const PAGE_SIZE = 20;

/** Hội thoại với trợ lý AI (trang lớn). Đồng bộ qua REST; aiStatus realtime qua SignalR. */
export function useAiChat(productId?: string) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [chatboxId, setChatboxId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Cửa sổ nhớ (số tin) từ BE — để vẽ mốc "AI context limit". null = chưa nạp, không vẽ.
  const [contextMessages, setContextMessages] = useState<number | null>(null);

  // Phân trang lịch sử: nạp PAGE_SIZE tin mới nhất, kéo lên đầu → nạp tiếp trang cũ hơn (prepend).
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);

  // Chỉ join group aiStatus khi đã biết chatboxId (lượt gửi đầu tiên chưa có phòng — xem fallback dưới).
  const { activity: liveActivity, narrations } = useAiActivity(
    chatboxId ? `chat-${chatboxId}` : null,
  );
  // Lượt gửi đầu (chưa có chatboxId → chưa join được group) hoặc realtime chưa kịp phát: fallback "thinking"
  // trong lúc đang chờ REST, để indicator không im lặng.
  const activity =
    liveActivity ?? (sending ? { operationId: "pending", phase: "thinking" as const } : null);

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
    // Cấu hình cửa sổ nhớ — best-effort, thiếu thì chỉ không vẽ mốc context.
    void chatApi
      .getAiConfig()
      .then((r) => {
        if (r.data.isSuccess) setContextMessages(r.data.data.contextMessages);
      })
      .catch(() => {});
    try {
      const ensure = await chatApi.ensureAiChatbox(productId);
      if (!ensure.data.isSuccess) {
        loadedRef.current = false;
        return;
      }
      const id = ensure.data.data.id;
      setChatboxId(id);
      const res = await chatApi.getMessages(id, 1, PAGE_SIZE);
      if (res.data.isSuccess) {
        setMessages(mapMessages(res.data.data.items));
        pageRef.current = 1;
        hasMoreRef.current = res.data.data.totalPages > 1;
        setHasMore(hasMoreRef.current);
      }
    } catch {
      loadedRef.current = false;
    }
  }, [productId]);

  // Kéo lên đầu → nạp trang cũ hơn rồi PREPEND. Dedup theo id để an toàn nếu có tin trùng biên trang.
  const loadMore = useCallback(async () => {
    const id = chatboxRef.current;
    if (!id || loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const next = pageRef.current + 1;
      const res = await chatApi.getMessages(id, next, PAGE_SIZE);
      if (res.data.isSuccess) {
        const older = mapMessages(res.data.data.items);
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...older.filter((m) => !seen.has(m.id)), ...prev];
        });
        pageRef.current = next;
        hasMoreRef.current = next < res.data.data.totalPages;
        setHasMore(hasMoreRef.current);
      }
    } catch {
      /* lỗi tạm — giữ nguyên, user kéo lại sẽ thử lại */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

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
    pageRef.current = 1;
    hasMoreRef.current = false;
    setHasMore(false);
  }, []);

  const send = useCallback(
    async (text: string, imageUrls?: string[]) => {
      const t = text.trim();
      if ((!t && !(imageUrls && imageUrls.length)) || sending) return;

      setMessages((p) => [
        ...p,
        { id: `u-${Date.now()}`, role: "user", content: t, images: imageUrls ?? [] },
      ]);
      setSending(true);
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
          // List vừa bị thay bằng cửa sổ gần nhất → cho phép kéo lên nạp lại lịch sử cũ hơn.
          pageRef.current = 1;
          hasMoreRef.current = true;
          setHasMore(true);
        } else {
          toast.error(res.data.message || "Trợ lý AI không phản hồi.");
        }
      } catch {
        toast.error("Không kết nối được trợ lý AI. Thử lại sau.");
      } finally {
        setSending(false);
      }
    },
    [sending, productId],
  );

  // Sửa & gửi lại 1 tin nhắn cũ của mình: BE soft-delete tin đó + mọi tin sau nó rồi trả lịch sử mới
  // → thay thế toàn bộ (không append). Chặn khi đang sending để tránh chồng lượt.
  const rewind = useCallback(
    async (messageId: string, newText: string) => {
      const t = newText.trim();
      if (!t || sending) return;
      // Optimistic: cắt ngay đuôi (tin sau điểm sửa) + hiển thị nội dung mới, để UI phản ánh liền
      // thay vì chờ LLM (Ollama có thể chậm/lỗi). Server trả history chính thức thì replace lại.
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        if (idx === -1) return prev;
        return [...prev.slice(0, idx), { ...prev[idx], content: t }];
      });
      setSending(true);
      try {
        const res = await chatApi.rewindAi(messageId, { newMessage: t });
        if (res.data.isSuccess) {
          setChatboxId(res.data.data.chatboxId);
          setMessages(mapHistory(res.data.data.history));
          // List vừa bị thay bằng cửa sổ gần nhất → cho phép kéo lên nạp lại lịch sử cũ hơn.
          pageRef.current = 1;
          hasMoreRef.current = true;
          setHasMore(true);
        } else {
          toast.error(res.data.message || "Không sửa được tin nhắn.");
        }
      } catch {
        toast.error("Không kết nối được trợ lý AI. Thử lại sau.");
      } finally {
        setSending(false);
      }
    },
    [sending],
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

  return {
    messages,
    sending,
    activity,
    narrations,
    contextMessages,
    send,
    rewind,
    uploadImage,
    loadHistory,
    loadMore,
    hasMore,
    loadingMore,
    clearConversation,
  };
}
