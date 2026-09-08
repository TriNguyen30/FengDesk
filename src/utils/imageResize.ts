/**
 * Chuẩn hoá ảnh ngay trên trình duyệt TRƯỚC khi upload — hai việc:
 *
 * 1. THU NHỎ. Ảnh chụp điện thoại thường 3–5 MB / 4000px. Nguyên chuỗi phải gánh kích thước đó —
 *    upload lên storage, backend tải về, encode base64 (+33%), rồi vision model xử lý ở độ phân giải
 *    gốc. Trong khi model chỉ nhìn ảnh ở vài trăm pixel là đủ nhận ra màu chủ đạo / bàn gỗ / bể cá.
 *    Thu nhỏ ở đây rẻ nhất: nhanh cho user, nhẹ cho storage, và cắt phần lớn thời gian suy luận ảnh.
 *
 * 2. ĐỔI ĐỊNH DẠNG. Backend chỉ nhận JPG/PNG/BMP/GIF (xem ImageUpload.AllowedContentTypes) vì đó là
 *    các định dạng vision model đang đọc được; .webp/.avif bị trả 422. Trình duyệt thì decode được
 *    .webp từ lâu, nên vẽ qua canvas rồi xuất JPEG là chuyển được, không cần đụng tới backend.
 */

/** Cạnh dài nhất sau khi thu nhỏ. Đủ để model nhận diện vật thể trong phòng. */
const MAX_EDGE = 1024;

/** Chất lượng JPEG — 0.8 gần như không thấy khác biệt bằng mắt nhưng giảm dung lượng rất nhiều. */
const JPEG_QUALITY = 0.8;

/** Dưới ngưỡng này thì thu nhỏ cũng không đáng, giữ nguyên file gốc. */
const SKIP_BELOW_BYTES = 300 * 1024;

/** Ảnh động sẽ mất animation nếu vẽ qua canvas — giữ nguyên. */
const SKIP_TYPES = ["image/gif"];

/** MIME backend chấp nhận — phải khớp ImageUpload.AllowedContentTypes bên BE. */
const BACKEND_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/bmp",
  "image/x-ms-bmp",
  "image/gif",
];

/**
 * Giá trị cho accept= của <input type="file"> ảnh.
 * Có webp dù backend không nhận: normalizeImageForUpload đổi sang JPEG trước khi gửi.
 */
export const IMAGE_UPLOAD_ACCEPT = "image/jpeg,image/png,image/bmp,image/gif,image/webp";

function isBackendReadable(type: string): boolean {
  return BACKEND_IMAGE_TYPES.includes(type.toLowerCase());
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được ảnh"));
    };
    img.src = url;
  });
}

/**
 * Vẽ file qua canvas rồi xuất JPEG (thu nhỏ luôn nếu vượt MAX_EDGE).
 * Trả null nếu trình duyệt không decode được — người gọi tự quyết định fallback.
 */
async function renderToJpeg(file: File): Promise<File | null> {
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    // Ảnh vốn đã nhỏ hơn ngưỡng → resize không giúp gì, nhưng nén lại JPEG vẫn có lợi nếu file nặng.
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return null;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return null;
  }
}

/**
 * Trả về file đã thu nhỏ, hoặc CHÍNH file gốc nếu không cần/không thể thu nhỏ.
 * Không bao giờ ném lỗi: thu nhỏ chỉ là tối ưu, hỏng thì vẫn phải upload được ảnh gốc.
 */
export async function shrinkImageForUpload(file: File): Promise<File> {
  if (SKIP_TYPES.includes(file.type) || file.size <= SKIP_BELOW_BYTES) return file;

  const jpeg = await renderToJpeg(file);
  if (!jpeg || jpeg.size >= file.size) return file; // nén xong còn to hơn → giữ bản gốc
  return jpeg;
}

/**
 * Dùng ở MỌI điểm upload ảnh. Định dạng backend đọc được thì chỉ thu nhỏ như cũ;
 * định dạng lạ (.webp, .avif…) thì ép sang JPEG bất kể dung lượng — ở đây mục tiêu là
 * đổi định dạng chứ không phải giảm size, nên không áp ngưỡng SKIP_BELOW_BYTES
 * (ảnh .webp thường nhẹ hơn ngưỡng đó, áp vào là lọt nguyên định dạng lên server).
 *
 * Đổi không được (trình duyệt cũ, file hỏng) → trả file gốc để backend báo lỗi định dạng như trước,
 * hơn là nuốt lỗi rồi upload một file rỗng.
 *
 * Lưu ý: .webp động sẽ thành ảnh tĩnh sau khi qua canvas — đánh đổi chấp nhận được để gửi được ảnh.
 */
export async function normalizeImageForUpload(file: File): Promise<File> {
  if (isBackendReadable(file.type)) return shrinkImageForUpload(file);

  const jpeg = await renderToJpeg(file);
  return jpeg ?? file;
}
