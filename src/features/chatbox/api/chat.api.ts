import fetchHttpClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { ChatMessage } from "@/features/chatbox/types/chatbox";

export interface GetChatMessagesResponse extends ApiResponse<ChatMessage[]> {}

export interface SendChatMessagePayload {
  roomId: string;
  content: string;
}

export interface SendChatMessageResponse extends ApiResponse<ChatMessage> {}

export const chatApi = {
  getMessages: (roomId: string) => {
    return fetchHttpClient.get<GetChatMessagesResponse>(`/chat/rooms/${roomId}/messages`);
  },

  sendMessage: (roomId: string, data: SendChatMessagePayload) => {
    return fetchHttpClient.post<SendChatMessageResponse>(`/chat/rooms/${roomId}/messages`, data);
  },
};
