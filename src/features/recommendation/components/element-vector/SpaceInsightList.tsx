import {
  Check,
  AlertTriangle,
  AlertCircle,
  Compass,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { SpaceInsights } from "@/features/users/types/workspace";
import InfoRow, { type InfoRowTone } from "./InfoRow";

interface SpaceInsightListProps {
  insights: SpaceInsights;
}

// Toxic (xung khắc) = vàng (cảnh báo, không phải đỏ-nguy hiểm), Imbalanced (lệch chuẩn) = xám
// (mặc định, chưa tới mức cần cảnh báo), Balanced (ổn) = xanh.
const CASE_TONE: Record<SpaceInsights["case"], InfoRowTone> = {
  Toxic: "warning",
  Imbalanced: "neutral",
  Balanced: "success",
};

// Icon riêng theo từng mức độ cho dòng "status" — tránh dùng chung tam giác cảnh báo cho mọi case.
const STATUS_ICON: Record<SpaceInsights["case"], LucideIcon> = {
  Toxic: AlertTriangle,
  Imbalanced: AlertCircle,
  Balanced: Check,
};

function iconFor(kind: string, caseType: SpaceInsights["case"]): LucideIcon {
  switch (kind) {
    // Đặc tính loại phòng — mang tính định hướng, không phải cảnh báo.
    case "trait":
      return Compass;
    case "status":
      return STATUS_ICON[caseType];
    default:
      return Target;
  }
}

/**
 * Render 3 dòng nhận định (trait → status → action) đã sinh sẵn ở BE (SpaceInsightBuilder):
 * đặc tính loại phòng → hiện trạng kèm NGUYÊN DO (tag user khai) → đề xuất chỉnh.
 * FE chỉ map icon + màu theo case.
 */
export default function SpaceInsightList({ insights }: SpaceInsightListProps) {
  const tone = CASE_TONE[insights.case];

  return (
    <div className="flex flex-col">
      {insights.lines.map((line, i) => (
        <InfoRow
          key={line.kind}
          icon={iconFor(line.kind, insights.case)}
          title={line.title}
          desc={line.text}
          first={i === 0}
          tone={tone}
        />
      ))}
    </div>
  );
}
