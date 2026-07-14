import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store";
import { chatApi } from "@/features/chatbox/api/chat.api";
import { chatHub } from "@/features/chatbox/lib/chatHub";
import type {
  Chatbox,
  ChatConnectionStatus,
  ChatMessage,
  ChatMessageBroadcast,
} from "@/features/chatbox/types/chatbox";

function upsert(list: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  if (list.some((m) => m.id === msg.id)) return list.map((m) => (m.id === msg.id ? msg : m));
  return [...list, msg].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** Loại trùng theo id (giữ bản cuối) — tránh duplicate React key khi list lỡ chứa message lặp. */
function dedupeById(list: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of list) byId.set(m.id, m);
  return [...byId.values()];
}

/**
 * Bảng điều khiển "Hộp thư khách hàng" cho garden owner/staff của MỘT store: hàng đợi phòng
 * đang mở + phòng đã nhận hỗ trợ, nhận hỗ trợ (claim), và trò chuyện realtime. Cùng cơ chế với
 * useStaffSupport (hỗ trợ nền tảng) nhưng scoped theo storeId — dùng API /chat/support/stores/{storeId}/*.
 */
export function useShopChatSupport(storeId: string | undefined) {
  const me = useAppSelector((s) => s.auth.user);
  const meId = me?.id;

  const [queue, setQueue] = useState<Chatbox[]>([]);
  const [myRooms, setMyRooms] = useState<Chatbox[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatConnectionStatus>("connecting");
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const activeRef = useRef(activeId);
  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const refresh = useCallback(async () => {
    if (!storeId) return [];
    const [q, mine] = await Promise.all([
      chatApi.getOpenStoreSupport(storeId),
      chatApi.getMyStoreChatboxes(storeId),
    ]);
    if (q.data.isSuccess) setQueue(q.data.data.items);
    if (mine.data.isSuccess) setMyRooms(mine.data.data.items);
    return mine.data.isSuccess ? mine.data.data.items : [];
  }, [storeId]);

  useEffect(() => {
    if (!meId || !storeId) return;
    let cancelled = false;

    const onMessage = (m: ChatMessageBroadcast) => {
      if (activeRef.current === m.chatboxId) setMessages((prev) => upsert(prev, m));
    };

    (async () => {
      const mine = await refresh();
      try {
        await chatHub.connect();
        if (cancelled) return;
        chatHub.on<ChatMessageBroadcast>("messageReceived", onMessage);
        chatHub.onReconnecting(() => setStatus("connecting"));
        chatHub.onReconnected(() => setStatus("connected"));
        chatHub.onClose(() => setStatus("disconnected"));
        setStatus("connected");
        await Promise.allSettled(mine.map((r) => chatHub.joinChatbox(r.id)));
      } catch (err) {
        console.warn("[shop-chat-support] SignalR connect failed:", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      chatHub.off("messageReceived", onMessage as (...a: unknown[]) => void);
    };
  }, [meId, storeId, refresh]);

  const openRoom = useCallback(async (chatboxId: string) => {
    setActiveId(chatboxId);
    void chatHub.joinChatbox(chatboxId).catch(() => {});
    try {
      const res = await chatApi.getMessages(chatboxId);
      if (res.data.isSuccess) setMessages(dedupeById([...res.data.data.items].reverse()));
      await chatApi.markRead(chatboxId);
      void chatHub.markChatboxRead(chatboxId).catch(() => {});
    } catch {
      toast.error("Không tải được cuộc trò chuyện.");
    }
  }, []);

  /** Nhận hỗ trợ một phòng trong hàng đợi: tự thêm mình làm participant (Vendor) rồi mở. */
  const claim = useCallback(
    async (chatboxId: string) => {
      if (!meId || claiming) return;
      setClaiming(true);
      try {
        const res = await chatApi.addParticipant(chatboxId, meId);
        if (!res.data.isSuccess) {
          toast.error(res.data.message || "Không nhận được cuộc trò chuyện.");
          return;
        }
        toast.success("Đã nhận hỗ trợ khách hàng này.");
        await refresh();
        await openRoom(chatboxId);
      } catch {
        toast.error("Không nhận được cuộc trò chuyện. Thử lại sau.");
      } finally {
        setClaiming(false);
      }
    },
    [meId, claiming, refresh, openRoom],
  );

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      const roomId = activeRef.current;
      if (!trimmed || !roomId || sending) return;
      setSending(true);
      try {
        const res = await chatApi.sendMessage(roomId, { content: trimmed });
        if (res.data.isSuccess) setMessages((prev) => upsert(prev, res.data.data));
        else toast.error(res.data.message || "Không gửi được tin nhắn.");
      } catch {
        toast.error("Không gửi được tin nhắn.");
      } finally {
        setSending(false);
      }
    },
    [sending],
  );

  const isMine = useCallback(
    (chatboxId: string) => myRooms.some((r) => r.id === chatboxId),
    [myRooms],
  );

  return {
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
    isMine,
  };
}
