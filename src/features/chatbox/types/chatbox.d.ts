// Khớp với DTO của BE (FengDeskAI.Application.Features.Chat.DTOs).
// Enum trả về dạng chuỗi (BE bật JsonStringEnumConverter).

export type MessageSenderType = "User" | "AiBot" | "System";
export type ParticipantType = "Customer" | "Staff" | "Manager" | "Admin" | "AiBot";
export type ParticipantRole = "Owner" | "Member";

export interface ChatParticipant {
  userId: string | null;
  participantType: ParticipantType;
  role: ParticipantRole;
  isMuted: boolean;
  isHidden: boolean;
}

export interface ChatMessage {
  id: string;
  chatboxId: string;
  senderId: string | null;
  senderType: MessageSenderType;
  senderName: string | null;
  content: string | null;
  createdAt: string;
  images: string[];
}

export interface Chatbox {
  id: string;
  isGroup: boolean;
  isSupport: boolean;
  /** Phòng đã đóng (khách xóa nhưng còn tin nhắn) → hiện mờ, khoá gửi tin. */
  isClosed: boolean;
  title: string | null;
  createdByUserId: string;
  productId: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
}

/** Tin nhắn broadcast realtime từ hub ("messageReceived"). Cùng shape với ChatMessage. */
export interface ChatMessageBroadcast {
  id: string;
  chatboxId: string;
  senderId: string | null;
  senderType: MessageSenderType;
  senderName: string | null;
  content: string | null;
  createdAt: string;
  images: string[];
}

export interface SendMessagePayload {
  content?: string;
  imageUrls?: string[];
}

export type ChatConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/** Trạng thái AI realtime (mảng ① — phát từ hub "aiStatus"). Khai báo sẵn để dùng sau. */
export type AiActivityPhase = "thinking" | "calling_tool" | "writing" | "done";
export interface AiActivity {
  chatboxId: string;
  phase: AiActivityPhase;
  toolName?: string | null;
}
