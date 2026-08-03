import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { logout } from "@/features/auth/store/authSlice";
import type { Chatbox, ChatConnectionStatus, ChatMessage } from "@/features/chatbox/types/chatbox";

type ChatView = "list" | "conversation";

interface ChatboxState {
  isOpen: boolean;
  /** Drawer trợ lý AI (khác khung chat hỗ trợ). Ở Redux vì nhiều nơi ngoài Navbar cần mở nó. */
  isAiAssistantOpen: boolean;
  view: ChatView;
  activeChatboxId: string | null;
  chatboxes: Chatbox[];
  /** Tin nhắn theo phòng (cũ → mới). */
  messagesByRoom: Record<string, ChatMessage[]>;
  connectionStatus: ChatConnectionStatus;
  isSending: boolean;
}

const initialState: ChatboxState = {
  isOpen: false,
  isAiAssistantOpen: false,
  view: "list",
  activeChatboxId: null,
  chatboxes: [],
  messagesByRoom: {},
  connectionStatus: "disconnected",
  isSending: false,
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

/** Loại trùng theo id (giữ bản cuối cùng). Tránh duplicate React key khi nguồn dữ liệu lỡ trả lặp. */
function dedupeById<T extends { id: string }>(list: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of list) byId.set(item.id, item);
  return [...byId.values()];
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
    openAiAssistant(state) {
      state.isAiAssistantOpen = true;
    },
    closeAiAssistant(state) {
      state.isAiAssistantOpen = false;
    },
    setView(state, action: PayloadAction<ChatView>) {
      state.view = action.payload;
    },
    setActiveChatbox(state, action: PayloadAction<string | null>) {
      state.activeChatboxId = action.payload;
    },
    setChatboxes(state, action: PayloadAction<Chatbox[]>) {
      // Dedupe theo id: BE có thể trả phòng lặp (vd query include nhiều collection) → tránh trùng key ở ChatRoomList.
      state.chatboxes = dedupeById(action.payload);
    },
    upsertChatbox(state, action: PayloadAction<Chatbox>) {
      const idx = state.chatboxes.findIndex((c) => c.id === action.payload.id);
      if (idx >= 0) state.chatboxes[idx] = action.payload;
      else state.chatboxes.unshift(action.payload);
    },
    setMessages(state, action: PayloadAction<{ roomId: string; messages: ChatMessage[] }>) {
      // Dedupe theo id TRƯỚC khi sort: addMessage đã chống trùng (upsert), set* cũng phải chống trùng
      // để không bao giờ render 2 message cùng key (nguyên nhân lỗi "two children with the same key").
      const sorted = dedupeById(action.payload.messages).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      state.messagesByRoom[action.payload.roomId] = sorted;
    },
    addMessage(state, action: PayloadAction<{ roomId: string; message: ChatMessage }>) {
      const { roomId, message } = action.payload;
      state.messagesByRoom[roomId] = upsert(state.messagesByRoom[roomId] ?? [], message);
    },
    // Unread theo TỪNG phòng (server tính authoritative qua LastReadAt; realtime bump tạm thời).
    bumpChatboxUnread(state, action: PayloadAction<string>) {
      const box = state.chatboxes.find((c) => c.id === action.payload);
      if (box) box.unreadCount = (box.unreadCount ?? 0) + 1;
    },
    clearChatboxUnread(state, action: PayloadAction<string>) {
      const box = state.chatboxes.find((c) => c.id === action.payload);
      if (box) box.unreadCount = 0;
    },
    setConnectionStatus(state, action: PayloadAction<ChatConnectionStatus>) {
      state.connectionStatus = action.payload;
    },
    setIsSending(state, action: PayloadAction<boolean>) {
      state.isSending = action.payload;
    },
    resetChatbox() {
      return initialState;
    },
  },
  // Đăng xuất → xóa toàn bộ state chat trong RAM. Nếu không, account mới đăng nhập
  // (SPA không reload) sẽ thấy tin nhắn của account cũ còn sót trong messagesByRoom.
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const {
  openChatbox,
  closeChatbox,
  toggleChatbox,
  openAiAssistant,
  closeAiAssistant,
  setView,
  setActiveChatbox,
  setChatboxes,
  upsertChatbox,
  setMessages,
  addMessage,
  bumpChatboxUnread,
  clearChatboxUnread,
  setConnectionStatus,
  setIsSending,
  resetChatbox,
} = chatboxSlice.actions;

type RootLike = { chatbox: ChatboxState };
export const selectChatbox = (s: RootLike) => s.chatbox;
export const selectChatboxIsOpen = (s: RootLike) => s.chatbox.isOpen;
export const selectAiAssistantIsOpen = (s: RootLike) => s.chatbox.isAiAssistantOpen;
export const selectChatboxView = (s: RootLike) => s.chatbox.view;
export const selectActiveChatboxId = (s: RootLike) => s.chatbox.activeChatboxId;
export const selectChatboxes = (s: RootLike) => s.chatbox.chatboxes;
export const selectConnectionStatus = (s: RootLike) => s.chatbox.connectionStatus;
// Tổng unread = cộng dồn unread của các phòng trong danh sách (server-driven theo LastReadAt).
export const selectChatboxUnreadCount = (s: RootLike) =>
  s.chatbox.chatboxes.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
export const selectIsSending = (s: RootLike) => s.chatbox.isSending;
/**
 * Nhánh "chưa mở phòng nào" phải trả về CÙNG một mảng rỗng — xem ghi chú của
 * NO_CART_ITEMS trong cartSlice: `?? []` tạo tham chiếu mới ở mỗi lần gọi nên
 * ChatWidget (luôn nằm trên màn hình) render lại sau mọi action Redux.
 */
const NO_MESSAGES: ChatMessage[] = [];

export const selectActiveMessages = (s: RootLike) =>
  s.chatbox.activeChatboxId
    ? (s.chatbox.messagesByRoom[s.chatbox.activeChatboxId] ?? NO_MESSAGES)
    : NO_MESSAGES;

export default chatboxSlice.reducer;
