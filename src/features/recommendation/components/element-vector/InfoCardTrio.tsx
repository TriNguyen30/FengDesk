import { Home, Sparkles, Compass, type LucideIcon } from "lucide-react";

interface InfoCardTrioProps {
  spaceTitle: string;
  spaceLine: string;
  menhLine: string;
  /** Null/undefined → ẩn dòng hướng đặt (vd chưa xác định được hướng hợp). */
  placementLine?: string | null;
}

/** 3 dòng: Không gian · Hợp bản mệnh · Hướng đặt — chỉ dùng ở chế độ fit sản phẩm × phòng. */
export default function InfoCardTrio({ spaceTitle, spaceLine, menhLine, placementLine }: InfoCardTrioProps) {
  return (
    <div className="flex flex-col">
      <Row icon={Home} title={spaceTitle} desc={spaceLine} first />
      <Row icon={Sparkles} title="Hợp với bản mệnh của bạn" desc={menhLine} />
      {placementLine && <Row icon={Compass} title="Hướng đặt gợi ý" desc={placementLine} />}
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  desc,
  first = false,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  first?: boolean;
}) {
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
