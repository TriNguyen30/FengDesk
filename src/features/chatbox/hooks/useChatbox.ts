import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { setAuthModal } from "@/features/auth/store/authSlice";
import { chatApi } from "@/features/chatbox/api/chat.api";
import { chatHub } from "@/features/chatbox/lib/chatHub";
import { useAiActivity } from "@/features/shared/ai-activity";
import {
  addMessage,
  bumpChatboxUnread,
  clearChatboxUnread,
  closeChatbox,
  openChatbox,
  selectActiveChatboxId,
  selectActiveMessages,
  selectChatboxes,
  selectChatboxIsOpen,
  selectChatboxUnreadCount,
  selectChatboxView,
  selectConnectionStatus,
  selectIsSending,
  setActiveChatbox,
  setChatboxes,
  setConnectionStatus,
  setIsSending,
  setMessages,
  setView,
  toggleChatbox,
  upsertChatbox,
} from "@/features/chatbox/store/chatboxSlice";
import type { ChatMessageBroadcast } from "@/features/chatbox/types/chatbox";

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
  // Trạng thái AI realtime chỉ của phòng đang mở (đóng/đổi phòng → tự leave group + reset).
  const { activity: aiActivity } = useAiActivity(
    activeChatboxId ? `chat-${activeChatboxId}` : null,
  );

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

  // Set id các phòng thuộc widget nhỏ (isGroup=true). Dùng trong onMessage để KHÔNG đếm unread
  // cho phòng AI riêng (isGroup=false) — phòng đó thuộc khung chat lớn.
  const widgetRoomIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    widgetRoomIdsRef.current = new Set(chatboxes.map((c) => c.id));
  }, [chatboxes]);

  const refreshChatboxes = useCallback(async () => {
    const res = await chatApi.getMyChatboxes();
    if (res.data.isSuccess) {
      // Widget nhỏ CHỈ hiện phòng nhóm/hỗ trợ (người ↔ người) đang HOẠT ĐỘNG. Loại:
      //  - phòng AI riêng (isGroup=false) → thuộc khung chat lớn (drawer);
      //  - phòng đã đóng (isClosed) → chỉ hiển thị bên staff, KHÔNG hiện cho customer.
      const widgetRooms = res.data.data.items.filter((c) => c.isGroup && !c.isClosed);
      dispatch(setChatboxes(widgetRooms));
      return widgetRooms;
    }
    return [];
  }, [dispatch]);

  // Kết nối hub NGAY KHI đã đăng nhập (KHÔNG gate theo isOpen) → vẫn nhận tin realtime + tăng unread
  // + nháy bóng chat kể cả khi widget đang đóng. Handler dùng isOpenRef/activeRef nên luôn đọc trạng thái mới.
  useEffect(() => {
    if (!meId) return;
    let cancelled = false;

    const onMessage = (m: ChatMessageBroadcast) => {
      // Chỉ xử lý tin của phòng thuộc widget nhỏ. Tin phòng AI riêng (khung lớn) bị bỏ qua
      // → không cộng unread / không nháy bóng chat nhầm khi đang chat ở khung lớn.
      if (!widgetRoomIdsRef.current.has(m.chatboxId)) return;
      dispatch(addMessage({ roomId: m.chatboxId, message: m }));
      const focused = isOpenRef.current && activeRef.current === m.chatboxId;
      const fromMe = !!m.senderId && m.senderId === meId;
      if (focused) {
        // Đang xem phòng → đẩy LastReadAt theo tin mới (reload không nháy lại) + giữ unread = 0.
        if (!fromMe) {
          void chatApi.markRead(m.chatboxId).catch(() => {});
          dispatch(clearChatboxUnread(m.chatboxId));
        }
      } else if (!fromMe) {
        dispatch(bumpChatboxUnread(m.chatboxId));
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
      chatHub.off("userJoined", onUserJoined as (...a: unknown[]) => void);
    };
  }, [meId, dispatch, refreshChatboxes]);

  // Đang XEM một cuộc trò chuyện (widget mở + view=conversation) → đánh dấu đã đọc.
  // Chạy cho MỌI đường vào phòng, kể cả khi bấm pulse nhảy thẳng vào phòng cũ (không qua openRoom).
  useEffect(() => {
    if (!isOpen || view !== "conversation" || !activeChatboxId) return;
    void chatApi.markRead(activeChatboxId).catch(() => {});
    void chatHub.markChatboxRead(activeChatboxId).catch(() => {});
    dispatch(clearChatboxUnread(activeChatboxId));
  }, [isOpen, view, activeChatboxId, dispatch]);

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
        // Đánh dấu đã đọc do effect "đang xem phòng" xử lý (chạy cho MỌI đường vào, kể cả mở thẳng).
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

  // Khách bấm "Nhắn tin" trên trang một shop cụ thể — lấy/tạo phòng hỗ trợ riêng của shop đó rồi mở
  // thẳng vào phòng (khác startSupport: phòng hỗ trợ nền tảng chung, không gắn shop nào).
  const startStoreSupport = useCallback(
    async (storeId: string) => {
      try {
        const res = await chatApi.startStoreSupport(storeId);
        if (res.data.isSuccess) {
          dispatch(upsertChatbox(res.data.data));
          dispatch(openChatbox());
          await openRoom(res.data.data.id);
        } else {
          toast.error(res.data.message || "Không mở được cuộc trò chuyện với cửa hàng.");
        }
      } catch {
        toast.error("Không mở được cuộc trò chuyện với cửa hàng.");
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
        // BE trả message theo vai trò: Owner → "Đã xóa...", người được mời/join → "Đã rời...".
        toast.success(res.data.message || "Đã xóa hội thoại.");
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
    startStoreSupport,
    newChat,
    deleteRoom,
    consentPulseRoomId,
    clearConsentPulse: useCallback(() => setConsentPulseRoomId(null), []),
  };
}
