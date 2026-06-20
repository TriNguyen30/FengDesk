import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { setAuthModal } from "@/features/auth/store/authSlice";
import { chatApi } from "@/features/chatbox/api/chat.api";
import { chatHub } from "@/features/chatbox/lib/chatHub";
import {
  addMessage,
  clearUnread,
  closeChatbox,
  incrementUnread,
  openChatbox,
  selectActiveChatboxId,
  selectActiveMessages,
  selectAiActivity,
  selectChatboxes,
  selectChatboxIsOpen,
  selectChatboxUnreadCount,
  selectChatboxView,
  selectConnectionStatus,
  selectIsSending,
  setActiveChatbox,
  setAiActivity,
  setChatboxes,
  setConnectionStatus,
  setIsSending,
  setMessages,
  setView,
  toggleChatbox,
  upsertChatbox,
} from "@/features/chatbox/store/chatboxSlice";
import type {
  AiActivity,
  ChatMessageBroadcast,
} from "@/features/chatbox/types/chatbox";

export function useChatbox() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const isOpen = useAppSelector(selectChatboxIsOpen);
  const view = useAppSelector(selectChatboxView);
  const activeChatboxId = useAppSelector(selectActiveChatboxId);
  const chatboxes = useAppSelector(selectChatboxes);
  const messages = useAppSelector(selectActiveMessages);
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const unreadCount = useAppSelector(selectChatboxUnreadCount);
  const isSending = useAppSelector(selectIsSending);
  const aiActivity = useAppSelector(selectAiActivity);

  const meId = user?.id;
  const activeRef = useRef(activeChatboxId);
  const isOpenRef = useRef(isOpen);
  const ensuringSupportRef = useRef(false);
  // Phòng cần "nháy" panel consent (khi có nhân viên vừa join). null = không nháy.
  const [consentPulseRoomId, setConsentPulseRoomId] = useState<string | null>(null);
  useEffect(() => {
    activeRef.current = activeChatboxId;
  }, [activeChatboxId]);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const refreshChatboxes = useCallback(async () => {
    const res = await chatApi.getMyChatboxes();
    if (res.data.isSuccess) {
      dispatch(setChatboxes(res.data.data.items));
      return res.data.data.items;
    }
    return [];
  }, [dispatch]);

  // Kết nối hub khi mở widget (mỗi lần mở thử lại → tự phục hồi nếu lần trước lỗi). Best-effort.
  useEffect(() => {
    if (!meId || !isOpen) return;
    let cancelled = false;

    const onMessage = (m: ChatMessageBroadcast) => {
      dispatch(addMessage({ roomId: m.chatboxId, message: m }));
      const focused = isOpenRef.current && activeRef.current === m.chatboxId;
      const fromMe = !!m.senderId && m.senderId === meId;
      if (!focused && !fromMe) dispatch(incrementUnread(1));
    };
    const onAiStatus = (a: AiActivity) => {
      if (activeRef.current === a.chatboxId) {
        dispatch(setAiActivity(a.phase === "done" ? null : a));
      }
    };
    const onUserJoined = (p: { chatboxId: string; userId: string }) => {
      // Có người (nhân viên hỗ trợ) vừa vào phòng → nháy panel consent để khách lưu ý.
      if (p.userId !== meId) setConsentPulseRoomId(p.chatboxId);
    };

    dispatch(setConnectionStatus("connecting"));
    (async () => {
      try {
        await chatHub.connect();
        if (cancelled) return;
        chatHub.on<ChatMessageBroadcast>("messageReceived", onMessage);
        chatHub.on<AiActivity>("aiStatus", onAiStatus);
        chatHub.on<{ chatboxId: string; userId: string }>("userJoined", onUserJoined);
        chatHub.onReconnecting(() => dispatch(setConnectionStatus("connecting")));
        chatHub.onReconnected(() => dispatch(setConnectionStatus("connected")));
        chatHub.onClose(() => dispatch(setConnectionStatus("disconnected")));
        dispatch(setConnectionStatus("connected"));

        // Join group mọi phòng để nhận realtime (kể cả phòng không mở) → badge chưa đọc.
        const rooms = await refreshChatboxes();
        await Promise.allSettled(rooms.map((r) => chatHub.joinChatbox(r.id)));
      } catch (err) {
        // Realtime hỏng KHÔNG chặn chat (gửi/nhận qua REST vẫn chạy). Log để chẩn đoán.
        console.warn("[chat] SignalR connect failed:", err);
        if (!cancelled) dispatch(setConnectionStatus("error"));
      }
    })();

    return () => {
      cancelled = true;
      // Chỉ gỡ handler của widget; KHÔNG disconnect (kết nối dùng chung với trang AI).
      chatHub.off("messageReceived", onMessage as (...a: unknown[]) => void);
      chatHub.off("aiStatus", onAiStatus as (...a: unknown[]) => void);
      chatHub.off("userJoined", onUserJoined as (...a: unknown[]) => void);
    };
  }, [meId, isOpen, dispatch, refreshChatboxes]);

  const open = useCallback(() => {
    if (!user) {
      dispatch(setAuthModal("login"));
      toast.info("Vui lòng đăng nhập để sử dụng chat");
      return;
    }
    dispatch(openChatbox());
  }, [dispatch, user]);
  const close = useCallback(() => dispatch(closeChatbox()), [dispatch]);
  const toggle = useCallback(() => {
    if (!user) {
      dispatch(setAuthModal("login"));
      return;
    }
    dispatch(toggleChatbox());
  }, [dispatch, user]);

  const openRoom = useCallback(
    async (chatboxId: string) => {
      dispatch(setActiveChatbox(chatboxId));
      dispatch(setView("conversation"));
      // Tham gia group realtime là best-effort — KHÔNG chặn việc tải tin qua REST nếu SignalR lỗi.
      void chatHub.joinChatbox(chatboxId).catch(() => {});
      try {
        const res = await chatApi.getMessages(chatboxId);
        if (res.data.isSuccess) {
          dispatch(setMessages({ roomId: chatboxId, messages: res.data.data.items }));
        }
        await chatApi.markRead(chatboxId);
        void chatHub.markChatboxRead(chatboxId).catch(() => {});
        dispatch(clearUnread());
      } catch {
        toast.error("Không tải được cuộc trò chuyện.");
      }
    },
    [dispatch],
  );

  const backToList = useCallback(() => {
    if (activeRef.current) void chatHub.leaveChatbox(activeRef.current);
    dispatch(setActiveChatbox(null));
    dispatch(setView("list"));
    void refreshChatboxes();
  }, [dispatch, refreshChatboxes]);

  const send = useCallback(
    async (content: string, imageUrls: string[] = []) => {
      const trimmed = content.trim();
      const roomId = activeRef.current;
      if ((!trimmed && imageUrls.length === 0) || !roomId || isSending) return;
      dispatch(setIsSending(true));
      try {
        const res = await chatApi.sendMessage(roomId, {
          content: trimmed || undefined,
          imageUrls: imageUrls.length ? imageUrls : undefined,
        });
        if (res.data.isSuccess) {
          // Thêm ngay từ response (id thật) — echo realtime sẽ dedupe theo id.
          dispatch(addMessage({ roomId, message: res.data.data }));
        } else {
          toast.error(res.data.message || "Không gửi được tin nhắn.");
        }
      } catch {
        toast.error("Không gửi được tin nhắn. Vui lòng thử lại.");
      } finally {
        dispatch(setIsSending(false));
      }
    },
    [dispatch, isSending],
  );

  // Upload 1 ảnh (kiểu Messenger): chỉ trả link, KHÔNG gửi tin ngay — composer gắn link vào imageUrls
  // rồi gửi cùng nội dung. signal cho phép hủy khi quá chậm.
  const uploadImage = useCallback(async (file: File, signal: AbortSignal): Promise<string> => {
    const roomId = activeRef.current;
    if (!roomId) throw new Error("no-room");
    const up = await chatApi.uploadImage(roomId, file, signal);
    if (!up.data.isSuccess) throw new Error(up.data.message || "upload-failed");
    return up.data.data;
  }, []);

  const startDirectChat = useCallback(
    async (otherUserId: string) => {
      try {
        const res = await chatApi.getOrStartDirect(otherUserId);
        if (res.data.isSuccess) {
          dispatch(upsertChatbox(res.data.data));
          dispatch(openChatbox());
          await openRoom(res.data.data.id);
        }
      } catch {
        toast.error("Không mở được cuộc trò chuyện.");
      }
    },
    [dispatch, openRoom],
  );

  // Tạo/mở phòng hỗ trợ qua REST — KHÔNG phụ thuộc SignalR. forceNew=true → luôn tạo phòng mới.
  const startSupport = useCallback(
    async (forceNew = false) => {
      if (ensuringSupportRef.current) return;
      ensuringSupportRef.current = true;
      try {
        const res = await chatApi.startSupport(forceNew);
        if (res.data.isSuccess) {
          dispatch(upsertChatbox(res.data.data));
          await openRoom(res.data.data.id);
        } else {
          toast.error(res.data.message || "Không mở được phòng hỗ trợ.");
        }
      } catch {
        toast.error("Không mở được phòng hỗ trợ. Kiểm tra kết nối máy chủ.");
      } finally {
        ensuringSupportRef.current = false;
      }
    },
    [dispatch, openRoom],
  );

  // Nút "Trò chuyện mới" — luôn tạo phòng hỗ trợ mới.
  const newChat = useCallback(() => startSupport(true), [startSupport]);

  // Xóa (ẩn) một hội thoại khỏi danh sách.
  const deleteRoom = useCallback(
    async (chatboxId: string) => {
      try {
        const res = await chatApi.deleteChatbox(chatboxId);
        if (!res.data.isSuccess) {
          toast.error(res.data.message || "Không xóa được hội thoại.");
          return;
        }
        void chatHub.leaveChatbox(chatboxId).catch(() => {});
        if (activeRef.current === chatboxId) {
          dispatch(setActiveChatbox(null));
          dispatch(setView("list"));
        }
        await refreshChatboxes();
        toast.success("Đã xóa hội thoại.");
      } catch {
        toast.error("Không xóa được hội thoại.");
      }
    },
    [dispatch, refreshChatboxes],
  );

  // Mở widget → tải danh sách phòng qua REST (độc lập SignalR). Nếu chưa có phòng nào → tự tạo phòng hỗ trợ.
  useEffect(() => {
    if (!meId || !isOpen) return;
    let cancelled = false;
    (async () => {
      const rooms = await refreshChatboxes();
      if (cancelled || activeRef.current !== null) return;
      if (rooms.length === 0) await startSupport();
    })();
    return () => {
      cancelled = true;
    };
  }, [meId, isOpen, refreshChatboxes, startSupport]);

  return {
    user,
    meId,
    isOpen,
    view,
    activeChatboxId,
    chatboxes,
    messages,
    connectionStatus,
    unreadCount,
    isSending,
    aiActivity,
    open,
    close,
    toggle,
    openRoom,
    backToList,
    send,
    uploadImage,
    startDirectChat,
    startSupport,
    newChat,
    deleteRoom,
    consentPulseRoomId,
    clearConsentPulse: useCallback(() => setConsentPulseRoomId(null), []),
  };
}
