import { Home, Sparkles, Compass } from "lucide-react";
import InfoRow from "./InfoRow";

interface InfoCardTrioProps {
  spaceTitle: string;
  spaceLine: string;
  menhLine: string;
  /** Null/undefined → ẩn dòng hướng đặt (vd chưa xác định được hướng hợp). */
  placementLine?: string | null;
}

/** 3 dòng: Không gian · Hợp bản mệnh · Hướng đặt — chỉ dùng ở chế độ fit sản phẩm × phòng. */
export default function InfoCardTrio({
  spaceTitle,
  spaceLine,
  menhLine,
  placementLine,
}: InfoCardTrioProps) {
  return (
    <div className="flex flex-col">
      <InfoRow icon={Home} title={spaceTitle} desc={spaceLine} first />
      <InfoRow icon={Sparkles} title="Hợp với bản mệnh của bạn" desc={menhLine} />
      {placementLine && <InfoRow icon={Compass} title="Hướng đặt gợi ý" desc={placementLine} />}
    </div>
  );
}
