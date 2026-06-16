import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ChatConnectionStatus, ChatMessage } from "@/features/chatbox/types/chatbox";

interface ChatboxState {
  isOpen: boolean;
  unreadCount: number;
  messages: ChatMessage[];
  connectionStatus: ChatConnectionStatus;
  isSending: boolean;
}

const initialState: ChatboxState = {
  isOpen: false,
  unreadCount: 0,
  messages: [],
  connectionStatus: "disconnected",
  isSending: false,
};

const chatboxSlice = createSlice({
  name: "chatbox",
  initialState,
  reducers: {
    openChatbox(state) {
      state.isOpen = true;
      state.unreadCount = 0;
    },
    closeChatbox(state) {
      state.isOpen = false;
    },
    toggleChatbox(state) {
      state.isOpen = !state.isOpen;
      if (state.isOpen) {
        state.unreadCount = 0;
      }
    },
    setMessages(state, action: PayloadAction<ChatMessage[]>) {
      const wasOpen = state.isOpen;
      const prevCount = state.messages.length;
      state.messages = action.payload;

      if (!wasOpen && action.payload.length > prevCount) {
        state.unreadCount += action.payload.length - prevCount;
      }
    },
    setConnectionStatus(state, action: PayloadAction<ChatConnectionStatus>) {
      state.connectionStatus = action.payload;
    },
    setIsSending(state, action: PayloadAction<boolean>) {
      state.isSending = action.payload;
    },
    resetChatbox(state) {
      state.messages = [];
      state.unreadCount = 0;
      state.connectionStatus = "disconnected";
      state.isSending = false;
    },
  },
});

export const {
  openChatbox,
  closeChatbox,
  toggleChatbox,
  setMessages,
  setConnectionStatus,
  setIsSending,
  resetChatbox,
} = chatboxSlice.actions;

export const selectChatbox = (state: { chatbox: ChatboxState }) => state.chatbox;
export const selectChatboxIsOpen = (state: { chatbox: ChatboxState }) => state.chatbox.isOpen;
export const selectChatboxUnreadCount = (state: { chatbox: ChatboxState }) =>
  state.chatbox.unreadCount;
export const selectChatboxMessages = (state: { chatbox: ChatboxState }) => state.chatbox.messages;
export const selectChatboxConnectionStatus = (state: { chatbox: ChatboxState }) =>
  state.chatbox.connectionStatus;
export const selectChatboxIsSending = (state: { chatbox: ChatboxState }) => state.chatbox.isSending;

export default chatboxSlice.reducer;
