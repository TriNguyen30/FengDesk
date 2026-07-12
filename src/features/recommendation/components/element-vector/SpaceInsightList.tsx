import { Check, AlertTriangle, Info, Target, type LucideIcon } from "lucide-react";
import type { SpaceInsights } from "@/features/users/types/workspace";
import InfoRow, { type InfoRowTone } from "./InfoRow";

interface SpaceInsightListProps {
  insights: SpaceInsights;
}

// Toxic (xung khắc) = đỏ nhẹ, Imbalanced (lệch chuẩn) = vàng, Balanced (ổn) = xanh.
const CASE_TONE: Record<SpaceInsights["case"], InfoRowTone> = {
  Toxic: "danger",
  Imbalanced: "warning",
  Balanced: "success",
};

function iconFor(kind: string, isBalanced: boolean): LucideIcon {
  switch (kind) {
    case "status":
      return isBalanced ? Check : AlertTriangle;
    case "detail":
      return Info;
    default:
      return Target;
  }
}

/** Render 3 dòng nhận định (status/detail/action) đã sinh sẵn ở BE (SpaceInsightBuilder) — FE chỉ map icon + màu theo case. */
export default function SpaceInsightList({ insights }: SpaceInsightListProps) {
  const isBalanced = insights.case === "Balanced";
  const tone = CASE_TONE[insights.case];

  return (
    <div className="flex flex-col">
      {insights.lines.map((line, i) => (
        <InfoRow
          key={line.kind}
          icon={iconFor(line.kind, isBalanced)}
          title={line.title}
          desc={line.text}
          first={i === 0}
          tone={tone}
        />
      ))}
    </div>
  );
}
