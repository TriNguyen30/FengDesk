import { API_BASE_URL, API_BASE_URL_FALLBACK } from "@/config/env";

/**
 * Chọn base URL của API giữa hostname chính và hostname dự phòng.
 *
 * Lý do tồn tại: nameserver của domain chính từng ngừng phản hồi, khi đó API vẫn chạy nhưng
 * trình duyệt không resolve nổi tên — không phải lỗi server, và không có cách nào chữa từ phía
 * server. Hostname dự phòng dùng nhà cung cấp DNS khác nên vẫn tới được đúng API đó.
 *
 * Dò MỘT LẦN lúc khởi động, không retry từng request: một request POST lỗi mạng KHÔNG có nghĩa
 * server chưa xử lý, nên retry sang hostname khác có thể tạo trùng đơn hàng hoặc trùng thanh toán.
 *
 * Phép dò chỉ hỏi "hostname còn tới được không" nên hoạt động cả khi BE chưa kịp deploy "/health".
 */

const CACHE_KEY = "api-base-url";
const PROBE_TIMEOUT_MS = 2500;

const normalize = (url: string) => url.replace(/\/+$/, "");

/** Health check nằm ở gốc server, không dưới "/api" — bỏ hậu tố đó trước khi gắn "/health". */
const healthUrlOf = (baseUrl: string) =>
  `${normalize(baseUrl).replace(/\/api$/i, "")}/health`;

const primary = normalize(API_BASE_URL ?? "");
const fallback = normalize(API_BASE_URL_FALLBACK ?? "");

let activeBaseUrl = primary;

/** Base URL đang dùng. Gọi tại thời điểm request, không cache lại ở module khác. */
export const getApiBaseUrl = () => activeBaseUrl;

const readCache = (): string | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    return cached === primary || cached === fallback ? cached : null;
  } catch {
    // Private mode hoặc site data bị chặn — bỏ cache, dò lại là xong.
    return null;
  }
};

const writeCache = (url: string) => {
  try {
    sessionStorage.setItem(CACHE_KEY, url);
  } catch {
    // Không lưu được thì thôi, lần sau dò lại.
  }
};

const isReachable = async (baseUrl: string): Promise<boolean> => {
  // AbortController + setTimeout thay cho AbortSignal.timeout: API kia cần Safari 16+,
  // còn build target của dự án là es2020.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(healthUrlOf(baseUrl), {
      method: "GET",
      signal: controller.signal,
    });
    // Câu hỏi ở đây là "hostname có tới được không", không phải "/health đã tồn tại chưa":
    // một 404 vẫn chứng minh DNS resolve được, TLS bắt tay xong và nginx đã trả lời. Chỉ 5xx
    // mới coi là chết, vì lúc đó API phía sau mới thật sự không phục vụ được.
    return response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Quyết định base URL cho cả phiên. Gọi trước khi render để request đầu tiên đã đi đúng đường.
 *
 * Không cấu hình dự phòng, hoặc cả hai đều không tới được → giữ hostname chính: khi đó lỗi hiện ra
 * đúng bản chất thay vì bị che bằng một URL cũng chết.
 */
export const initApiBaseUrl = async (): Promise<string> => {
  if (!fallback || fallback === primary) return activeBaseUrl;

  const cached = readCache();
  if (cached) {
    activeBaseUrl = cached;
    return activeBaseUrl;
  }

  if (await isReachable(primary)) {
    activeBaseUrl = primary;
  } else if (await isReachable(fallback)) {
    console.warn(`[api] ${primary} không phản hồi — chuyển sang ${fallback}`);
    activeBaseUrl = fallback;
  }

  writeCache(activeBaseUrl);
  return activeBaseUrl;
};
