import fetchHttpClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Chatbox, ChatMessage, SendMessagePayload } from "@/features/chatbox/types/chatbox";

export interface ChatboxListResponse {
  items: Chatbox[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PagedMessages {
  items: ChatMessage[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Một dòng lịch sử hội thoại AI (role = "User" | "AiBot" | "System"). */
export interface AiChatTurn {
  role: string;
  content: string | null;
  images: string[];
}

export interface AiChatResponse {
  chatboxId: string;
  model: string;
  reply: string;
  history: AiChatTurn[];
}

export interface AiChatRequestPayload {
  message?: string;
  chatboxId?: string;
  productId?: string;
  model?: string;
  imageUrls?: string[];
}

/**
 * Client REST cho chat người↔người (khớp ChatController, base URL đã gồm /api).
 * Realtime (nhận tin/đã đọc) đi qua SignalR hub — xem lib/chatHub.ts.
 */
export const chatApi = {
  /** Danh sách phòng của tôi (mới cập nhật trước). */
  getMyChatboxes: (page = 1, pageSize = 20) =>
    fetchHttpClient.get<ApiResponse<ChatboxListResponse>>("/chat/chatboxes", { page, pageSize }),

  /** Tin nhắn trong phòng (paged, BE trả mới nhất trước). */
  getMessages: (chatboxId: string, page = 1, pageSize = 30) =>
    fetchHttpClient.get<ApiResponse<PagedMessages>>(`/chat/chatbox/${chatboxId}/messages`, {
      page,
      pageSize,
    }),

  /** Gửi tin (text và/hoặc link ảnh). Lưu DB + BE tự broadcast realtime. */
  sendMessage: (chatboxId: string, payload: SendMessagePayload) =>
    fetchHttpClient.post<ApiResponse<ChatMessage>>(`/chat/chatbox/${chatboxId}/messages`, payload),

  /** Lấy hoặc tạo phòng 1-1 với user khác. */
  getOrStartDirect: (otherUserId: string) =>
    fetchHttpClient.post<ApiResponse<Chatbox>>(`/chat/chatbox/with/${otherUserId}`),

  /** Lấy/tạo phòng hỗ trợ. forceNew=true → luôn tạo phòng mới ("Trò chuyện mới"). */
  startSupport: (forceNew = false) =>
    fetchHttpClient.post<ApiResponse<Chatbox>>(`/chat/support?forceNew=${forceNew}`),

  /** Xóa (ẩn) cuộc trò chuyện khỏi danh sách của tôi. */
  deleteChatbox: (chatboxId: string) =>
    fetchHttpClient.delete<ApiResponse<null>>(`/chat/chatbox/${chatboxId}`),

  /** [Staff] Hàng đợi phòng hỗ trợ đang mở (chưa có nhân sự nhận). */
  getOpenSupport: (page = 1, pageSize = 20) =>
    fetchHttpClient.get<ApiResponse<ChatboxListResponse>>("/chat/support/open", { page, pageSize }),

  /** Thêm thành viên vào phòng (staff tự nhận hỗ trợ → truyền userId của chính mình; hoặc mời người khác). */
  addParticipant: (chatboxId: string, userId: string) =>
    fetchHttpClient.post<ApiResponse<null>>(`/chat/chatbox/${chatboxId}/participants`, { userId }),

  /** Tải ảnh chat lên storage → trả link để gắn vào tin nhắn. */
  uploadImage: (chatboxId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchHttpClient.post<ApiResponse<string>>(
      `/chat/chatbox/${chatboxId}/images`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  /** Đánh dấu cả phòng đã đọc. */
  markRead: (chatboxId: string) =>
    fetchHttpClient.patch<ApiResponse<null>>(`/chat/chatbox/${chatboxId}/read-all`),

  /** Gửi tin cho trợ lý AI (trang AI lớn). Bỏ trống chatboxId ở lượt đầu → server tạo & trả về. */
  sendToAi: (payload: AiChatRequestPayload) =>
    fetchHttpClient.post<ApiResponse<AiChatResponse>>("/chat/ai/messages", payload),

  /** Quyền chia sẻ thông tin của tôi cho nhân viên hỗ trợ trong phòng. */
  getConsent: (chatboxId: string) =>
    fetchHttpClient.get<ApiResponse<ChatConsent>>(`/chat/chatbox/${chatboxId}/consent`),
  setConsent: (chatboxId: string, body: ChatConsent) =>
    fetchHttpClient.put<ApiResponse<ChatConsent>>(`/chat/chatbox/${chatboxId}/consent`, body),
};

export interface ChatConsent {
  shareProfile: boolean;
  shareWorkspaces: boolean;
  shareOrders: boolean;
}
