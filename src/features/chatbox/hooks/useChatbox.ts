import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { chatService } from "@/features/chatbox/lib/chatService";
import {
  closeChatbox,
  openChatbox,
  resetChatbox,
  selectChatboxConnectionStatus,
  selectChatboxIsOpen,
  selectChatboxIsSending,
  selectChatboxMessages,
  selectChatboxUnreadCount,
  setConnectionStatus,
  setIsSending,
  setMessages,
  toggleChatbox,
} from "@/features/chatbox/store/chatboxSlice";
import { getChatRoomId } from "@/features/chatbox/utils/chatUtils";
import { setAuthModal } from "@/features/auth/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function useChatbox() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isOpen = useAppSelector(selectChatboxIsOpen);
  const unreadCount = useAppSelector(selectChatboxUnreadCount);
  const messages = useAppSelector(selectChatboxMessages);
  const connectionStatus = useAppSelector(selectChatboxConnectionStatus);
  const isSending = useAppSelector(selectChatboxIsSending);
  const roomIdRef = useRef<string | null>(null);

  const roomId = useMemo(() => getChatRoomId(user?.id), [user?.id]);

  useEffect(() => {
    if (roomIdRef.current && roomIdRef.current !== roomId) {
      dispatch(resetChatbox());
    }
    roomIdRef.current = roomId;
  }, [roomId, dispatch]);

  useEffect(() => {
    if (!isOpen) return;

    dispatch(setConnectionStatus("connecting"));

    const unsubscribe = chatService.subscribe(roomId, (nextMessages) => {
      dispatch(setMessages(nextMessages));
      dispatch(setConnectionStatus("connected"));
    });

    return () => {
      unsubscribe();
      dispatch(setConnectionStatus("disconnected"));
    };
  }, [isOpen, roomId, dispatch]);

  const open = useCallback(() => dispatch(openChatbox()), [dispatch]);
  const close = useCallback(() => dispatch(closeChatbox()), [dispatch]);
  const toggle = useCallback(() => dispatch(toggleChatbox()), [dispatch]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return;

      if (!user) {
        dispatch(setAuthModal("login"));
        toast.info("Vui lòng đăng nhập để chat với FengDesk");
        return;
      }

      dispatch(setIsSending(true));
      try {
        await chatService.sendMessage({
          roomId,
          content: trimmed,
          senderId: user.id,
          senderName: user.fullName || user.email,
          senderRole: "customer",
        });
      } catch {
        toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
        dispatch(setConnectionStatus("error"));
      } finally {
        dispatch(setIsSending(false));
      }
    },
    [dispatch, isSending, roomId, user],
  );

  return {
    isOpen,
    unreadCount,
    messages,
    connectionStatus,
    isSending,
    isRealtime: chatService.isRealtimeEnabled(),
    open,
    close,
    toggle,
    sendMessage,
  };
}
