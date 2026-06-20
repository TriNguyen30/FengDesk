import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AiActivity,
  Chatbox,
  ChatConnectionStatus,
  ChatMessage,
} from "@/features/chatbox/types/chatbox";

type ChatView = "list" | "conversation";

interface ChatboxState {
  isOpen: boolean;
  view: ChatView;
  activeChatboxId: string | null;
  chatboxes: Chatbox[];
  /** Tin nhắn theo phòng (cũ → mới). */
  messagesByRoom: Record<string, ChatMessage[]>;
  connectionStatus: ChatConnectionStatus;
  isSending: boolean;
  /** Badge tổng (số tin chưa đọc khi widget đóng / không ở đúng phòng). */
  unreadCount: number;
  /** Trạng thái AI realtime trong phòng đang mở (mảng ①). */
  aiActivity: AiActivity | null;
}

const initialState: ChatboxState = {
  isOpen: false,
  view: "list",
  activeChatboxId: null,
  chatboxes: [],
  messagesByRoom: {},
  connectionStatus: "disconnected",
  isSending: false,
  unreadCount: 0,
  aiActivity: null,
};

function upsert(list: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const idx = list.findIndex((m) => m.id === msg.id);
  if (idx >= 0) {
    const next = list.slice();
    next[idx] = msg;
    return next;
  }
  return [...list, msg].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

const chatboxSlice = createSlice({
  name: "chatbox",
  initialState,
  reducers: {
    openChatbox(state) {
      state.isOpen = true;
    },
    closeChatbox(state) {
      state.isOpen = false;
    },
    toggleChatbox(state) {
      state.isOpen = !state.isOpen;
    },
    setView(state, action: PayloadAction<ChatView>) {
      state.view = action.payload;
    },
    setActiveChatbox(state, action: PayloadAction<string | null>) {
      state.activeChatboxId = action.payload;
      state.aiActivity = null;
    },
    setChatboxes(state, action: PayloadAction<Chatbox[]>) {
      state.chatboxes = action.payload;
    },
    upsertChatbox(state, action: PayloadAction<Chatbox>) {
      const idx = state.chatboxes.findIndex((c) => c.id === action.payload.id);
      if (idx >= 0) state.chatboxes[idx] = action.payload;
      else state.chatboxes.unshift(action.payload);
    },
    setMessages(state, action: PayloadAction<{ roomId: string; messages: ChatMessage[] }>) {
      const sorted = [...action.payload.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      state.messagesByRoom[action.payload.roomId] = sorted;
    },
    addMessage(state, action: PayloadAction<{ roomId: string; message: ChatMessage }>) {
      const { roomId, message } = action.payload;
      state.messagesByRoom[roomId] = upsert(state.messagesByRoom[roomId] ?? [], message);
    },
    incrementUnread(state, action: PayloadAction<number>) {
      state.unreadCount += action.payload;
    },
    clearUnread(state) {
      state.unreadCount = 0;
    },
    setConnectionStatus(state, action: PayloadAction<ChatConnectionStatus>) {
      state.connectionStatus = action.payload;
    },
    setIsSending(state, action: PayloadAction<boolean>) {
      state.isSending = action.payload;
    },
    setAiActivity(state, action: PayloadAction<AiActivity | null>) {
      state.aiActivity = action.payload;
    },
    resetChatbox() {
      return initialState;
    },
  },
});

export const {
  openChatbox,
  closeChatbox,
  toggleChatbox,
  setView,
  setActiveChatbox,
  setChatboxes,
  upsertChatbox,
  setMessages,
  addMessage,
  incrementUnread,
  clearUnread,
  setConnectionStatus,
  setIsSending,
  setAiActivity,
  resetChatbox,
} = chatboxSlice.actions;

type RootLike = { chatbox: ChatboxState };
export const selectChatbox = (s: RootLike) => s.chatbox;
export const selectChatboxIsOpen = (s: RootLike) => s.chatbox.isOpen;
export const selectChatboxView = (s: RootLike) => s.chatbox.view;
export const selectActiveChatboxId = (s: RootLike) => s.chatbox.activeChatboxId;
export const selectChatboxes = (s: RootLike) => s.chatbox.chatboxes;
export const selectConnectionStatus = (s: RootLike) => s.chatbox.connectionStatus;
export const selectChatboxUnreadCount = (s: RootLike) => s.chatbox.unreadCount;
export const selectIsSending = (s: RootLike) => s.chatbox.isSending;
export const selectAiActivity = (s: RootLike) => s.chatbox.aiActivity;
export const selectActiveMessages = (s: RootLike) =>
  s.chatbox.activeChatboxId ? (s.chatbox.messagesByRoom[s.chatbox.activeChatboxId] ?? []) : [];

export default chatboxSlice.reducer;
