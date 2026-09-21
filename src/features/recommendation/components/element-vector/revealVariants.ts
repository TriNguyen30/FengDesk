import type { Variants } from "framer-motion";

/**
 * Hiệu ứng "mở bảng" khi dữ liệu về: các khối con hiện lần lượt từ trên xuống (trượt nhẹ + mờ dần vào).
 * Dùng `revealContainer` cho khung ngoài và `revealItem` cho từng khối con.
 */
export const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
};
