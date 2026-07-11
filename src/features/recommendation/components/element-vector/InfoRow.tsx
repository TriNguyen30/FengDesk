import type { LucideIcon } from "lucide-react";

export type InfoRowTone = "neutral" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<InfoRowTone, string> = {
  neutral: "bg-gray-100 text-gray-500",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
};

interface InfoRowProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  first?: boolean;
  /** Màu icon tròn — mặc định xám trung tính (InfoCardTrio); SpaceInsightList tô theo case. */
  tone?: InfoRowTone;
}

/** Icon tròn + tiêu đề + mô tả — 1 dòng dùng chung cho InfoCardTrio (fit sản phẩm) và SpaceInsightList (không gian thuần). */
export default function InfoRow({ icon: Icon, title, desc, first = false, tone = "neutral" }: InfoRowProps) {
  return (
    <div className={`flex gap-3 py-3 ${first ? "" : "border-t border-gray-200"}`}>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[tone]}`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-gray-800">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-relaxed text-gray-500">{desc}</div>
      </div>
    </div>
  );
}
