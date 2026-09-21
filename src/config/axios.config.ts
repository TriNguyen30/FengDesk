/**
 * Timeout cho request PHẢI CHỜ MODEL chạy xong (chat AI, phân loại tag, phiên âm giọng nói...).
 * Dài hơn hẳn mặc định vì đây là thời gian suy luận thật của model, không phải độ trễ mạng —
 * cắt ở 60s thì user thấy "lỗi mạng" trong khi BE vẫn đang chạy bình thường và sẽ trả kết quả.
 *
 * Khớp với timeout phía BE gọi Ollama (Ai:Relay -> TimeoutSeconds = 120) - FE không được
 * bỏ cuộc trước BE, nếu không sẽ hủy oan một lượt chạy sắp xong.
 *
 * CHỈ dùng cho endpoint gọi model. Request thường vẫn giữ mặc định bên dưới: nới timeout
 * cho mọi thứ nghĩa là mạng chết cũng phải chờ 2 phút mới biết.
 */
export const AI_REQUEST_TIMEOUT_MS = 120_000;

export const axiosBaseConfig = {
  headers: {
    "Content-Type": "application/json;charset=UTF-8",
    "ngrok-skip-browser-warning": "true",
  },
  /** Mặc định cho request thường (CRUD, danh sách). Endpoint AI dùng AI_REQUEST_TIMEOUT_MS. */
  timeout: 60_000,
};
