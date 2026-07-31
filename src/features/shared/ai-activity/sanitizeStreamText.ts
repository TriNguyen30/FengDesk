/**
 * Lớp phòng thủ phụ phía client cho MỌI text ephemeral do AI stream ra (thinking tail, narration…).
 * Nguồn sự thật vẫn là bộ lọc BE (`SanitizeMode.LiveStream`) — dữ liệu không được lọc thì đã nằm trên
 * dây SignalR rồi, FE không cứu được. Giữ bản này để: (1) FE cũ/BE cũ lệch version không lộ ra màn hình,
 * (2) mọi chỗ render stream chỉ cần import 1 hàm thay vì tự chế regex.
 *
 * Bộ luật soi gương `AiTextSanitizer.cs` — sửa một bên thì sửa cả hai.
 */

/** GUID đầy đủ, kể cả nằm trong URL (kênh stream không có nhu cầu link). */
const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Mảnh hex còn sót khi chuỗi bị cắt giữa một GUID (BE chỉ gửi phần đuôi của chuỗi suy luận).
 * Bắt ≥3 nhóm hex nối bằng "-" VÀ tổng ≥14 ký tự (chặn ngày "2024-01-15" lọt vào), hoặc một dải hex
 * liền ≥12 ký tự CÓ ÍT NHẤT 1 chữ a-f (chặn số tiền/timestamp toàn chữ số).
 */
const HEX_FRAGMENT =
  /(?<![0-9a-z])(?:(?=[0-9a-f-]{14,})(?:[0-9a-f]+-){2,}[0-9a-f]+|(?=[0-9a-f]*[a-f])[0-9a-f]{12,})(?![0-9a-z])/gi;

/**
 * GUID bị cắt ở MÉP CUỐI (đuôi đang lớn dần, vd "…/products/7f3c21ab-9d44") — chưa đủ dài để
 * HEX_FRAGMENT nhận ra. Chỉ áp ở cuối chuỗi nên không đụng text bình thường.
 * Còn sót tối đa 8 ký tự hex đầu — ngang mức `SanitizeMode.UserMessage` vẫn để lộ, chấp nhận được.
 */
const TRAILING_PARTIAL_ID = /(?<![0-9a-z])[0-9a-f]{8}-[0-9a-f-]*$/i;

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/g;
/** Chỉ nhận "+84…" hoặc "0…" — "84…" trần dễ trùng số tiền (8.400.000.000đ). */
const PHONE_VN = /(?<![\d.,])(?:\+84|0)\d{8,10}(?!\d)/g;
const ABSOLUTE_URL = /https?:\/\/\S+/g;

/** Lọc text stream trước khi render. Idempotent — gọi lại trên text đã lọc không đổi kết quả. */
export function sanitizeStreamText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(ABSOLUTE_URL, "[link]")
    .replace(GUID, "[id]")
    .replace(HEX_FRAGMENT, "[id]")
    .replace(TRAILING_PARTIAL_ID, "[id]")
    .replace(EMAIL, "[email]")
    .replace(PHONE_VN, "[phone]");
}
