/**
 * "Khe sáng" — một ngôn ngữ thị giác dùng chung ở hai chỗ:
 *
 * - từng dòng trong "Điểm này đến từ đâu?" (`ScoreWaterfall`),
 * - khe trạng thái AI lúc đang stream (`AiActivityIndicator`).
 *
 * Gồm đúng hai lớp:
 *
 * 1. **Vệt sáng** hắt từ mép DƯỚI ngược lên, phủ cả chiều cao khối.
 * 2. **Vạch mảnh** nằm đúng mép đó, đậm ở tâm rồi nhạt dần về trong suốt ở hai đầu.
 *
 * Để chung một file vì hai nơi phải trông giống nhau — tách ra là lần chỉnh sau chỉ sửa được một
 * nửa, rồi hai chỗ trôi khỏi nhau (đúng kiểu đã xảy ra với màu emerald trước đó).
 *
 * Tham số `color` nhận cả `var(--color-...)` lẫn mã hex; `percent` là độ đục tính theo phần trăm.
 */

/**
 * Vệt sáng hắt từ mép dưới lên.
 *
 * Bán kính ngang đặt đúng `50%` và điểm tắt ở `100%`: ellipse vừa khít nửa bề ngang mỗi bên nên ánh
 * sáng tắt ĐÚNG tại hai đầu hộp — tức đúng hai đầu vạch mảnh, vì hai thứ dùng chung một hộp. Để
 * bán kính nhỏ hơn (hoặc điểm tắt dưới 100%) là vệt sáng ngắn hơn hẳn cái vạch, nhìn ra ngay.
 */
export const seamWash = (color: string, percent: number) =>
  `radial-gradient(50% 92% at 50% 100%, color-mix(in srgb, ${color} ${percent}%, transparent) 0%, transparent 100%)`;

/**
 * Vạch mảnh ở mép dưới: đậm ở tâm, về trong suốt ở hai đầu.
 *
 * Hai đầu phải trong suốt HẲN chứ không phải nhạt màu: chỗ đó cái nhìn thấy là vạch nền xám nằm
 * dưới, nên vạch đọc ra "sáng lên ở giữa" thay vì "đổi màu cả cây".
 */
export const seamLine = (color: string, percent: number) =>
  `linear-gradient(90deg, transparent 0%, color-mix(in srgb, ${color} ${percent}%, transparent) 50%, transparent 100%)`;
