export type ChatSenderRole = "customer" | "staff" | "bot";

export interface ChatMessage {
  id: string;
  roomId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: ChatSenderRole;
  createdAt: string;
}

export interface SendMessageParams {
  roomId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: ChatSenderRole;
}

export interface ChatRoom {
  id: string;
  participantId: string;
  participantName: string;
  lastMessageAt: string;
}

export type ChatConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export type MessageListener = (messages: ChatMessage[]) => void;
export type Unsubscribe = () => void;
