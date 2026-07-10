import type { LucideIcon } from "lucide-react";

interface InfoRowProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  first?: boolean;
}

/** Icon tròn + tiêu đề + mô tả — 1 dòng dùng chung cho InfoCardTrio (fit sản phẩm) và SpaceInsightList (không gian thuần). */
export default function InfoRow({ icon: Icon, title, desc, first = false }: InfoRowProps) {
  return (
    <div className={`flex gap-3 py-3 ${first ? "" : "border-t border-gray-100"}`}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-gray-800">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-relaxed text-gray-500">{desc}</div>
      </div>
    </div>
  );
}
