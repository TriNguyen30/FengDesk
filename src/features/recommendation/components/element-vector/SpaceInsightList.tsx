import { Check, Minus, Target, type LucideIcon } from "lucide-react";
import type { ElementAnalysisRow } from "@/features/users/types/workspace";
import InfoRow from "./InfoRow";
import { elementVi, gapStatus } from "./constants";

function joinVi(elements: string[]): string {
  return elements.map(elementVi).join(" và ");
}

interface SpaceInsightListProps {
  rows: ElementAnalysisRow[];
  dominantNeed: string;
}

/** Danh sách gợi ý suy trực tiếp từ vector ngũ hành của phòng (ideal/current/gap) — không có dữ liệu bản mệnh/hướng đặt ở mức phòng thuần. */
export default function SpaceInsightList({ rows, dominantNeed }: SpaceInsightListProps) {
  const deficit = rows.filter((r) => gapStatus(r.gap) === "deficit").map((r) => r.element);
  const surplus = rows.filter((r) => gapStatus(r.gap) === "surplus").map((r) => r.element);

  const items: { icon: LucideIcon; title: string; desc: string }[] = [
    deficit.length > 0
      ? {
          icon: Check,
          title: "Hợp với không gian này",
          desc: `Bù hành ${joinVi(deficit)} mà phòng đang thiếu.`,
        }
      : {
          icon: Check,
          title: "Ngũ hành đã cân bằng",
          desc: "Phòng hiện không thiếu hành nào đáng kể.",
        },
  ];

  if (surplus.length > 0) {
    items.push({
      icon: Minus,
      title: "Đang dư trong phòng",
      desc: `Hành ${joinVi(surplus)} hiện đang dư — hạn chế bổ sung thêm.`,
    });
  }

  items.push({
    icon: Target,
    title: "Ưu tiên bổ sung",
    desc: `Hành ${elementVi(dominantNeed)} đang thiếu nhiều nhất — nên ưu tiên khi chọn vật phẩm mới.`,
  });

  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <InfoRow key={item.title} icon={item.icon} title={item.title} desc={item.desc} first={i === 0} />
      ))}
    </div>
  );
}
