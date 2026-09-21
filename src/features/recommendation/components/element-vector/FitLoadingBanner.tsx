import { Bot, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { revealItem } from "./revealVariants";
import type { ReactNode } from "react";

interface FitLoadingBannerProps {
  /** Dòng chính, vd "Đang tính độ phù hợp với không gian của bạn…". */
  label: string;
  /** Dòng phụ nhỏ bên dưới thanh chạy. */
  hint?: string;
}

/**
 * Banner "đang tải" của cụm độ phù hợp — cùng ngôn ngữ hình ảnh với `WorkspaceIntakeProgress`
 * (bot + spinner + thanh chạy vô tận): user đã quen nó ở bước "AI điền giúp", gặp lại ở trang sản phẩm
 * là hiểu ngay "hệ thống đang làm việc", không phải trang treo. Thay cho khối xám nhấp nháy trước đây —
 * khối xám không nói được nó đang chờ cái gì, và 1–2 s trên remote đủ để user tưởng lỗi.
 */
export default function FitLoadingBanner({ label, hint }: FitLoadingBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
    >
      <style>{`@keyframes fitLoadBar{0%{margin-left:-40%}100%{margin-left:100%}}`}</style>
      <div className="flex items-center gap-2 text-[13px] font-medium text-primary">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
          <Bot size={13} />
        </span>
        <Loader2 size={13} className="shrink-0 animate-spin" />
        <span className="min-w-0 flex-1 truncate whitespace-nowrap">{label}</span>
        <Sparkles size={12} className="ml-auto shrink-0 opacity-70" />
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full w-2/5 rounded-full bg-primary/60"
          style={{ animation: "fitLoadBar 1.2s ease-in-out infinite" }}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </motion.div>
  );
}

/** Khối con có hiệu ứng mở — tiện dùng thay `<div>` trong khung `revealContainer`. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={revealItem} className={className}>
      {children}
    </motion.div>
  );
}
