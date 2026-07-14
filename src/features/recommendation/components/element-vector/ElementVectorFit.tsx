import type {
  ElementAnalysisRow,
  WorkspaceElementAnalysis,
} from "@/features/users/types/workspace";
import ElementBars, { type ElementBarRow, type BarTone } from "./ElementBars";
import ElementTags from "./ElementTags";
import SpaceInsightList from "./SpaceInsightList";
import ElementRadarChart from "./ElementRadarChart";
import { ELEMENT_ORDER, elementColor, elementVi, gapStatus } from "./constants";

/** Đảm bảo luôn có đủ 5 hành theo đúng thứ tự hiển thị, kể cả khi BE trả rỗng. */
function toOrderedRows(elements: ElementAnalysisRow[]): ElementAnalysisRow[] {
  const byElement = new Map(elements.map((row) => [row.element, row]));
  return ELEMENT_ORDER.map(
    (element) =>
      byElement.get(element) ?? { element, ideal: 0, adjustedIdeal: 0, current: 0, gap: 0 },
  );
}

const GAP_TONE: Record<ReturnType<typeof gapStatus>, BarTone> = {
  deficit: "positive",
  surplus: "negative",
  balanced: "neutral",
};

const GAP_LABEL: Record<ReturnType<typeof gapStatus>, string> = {
  deficit: "Thiếu",
  surplus: "Thừa",
  balanced: "Cân bằng",
};

function toBarRow(row: ElementAnalysisRow): ElementBarRow {
  const status = gapStatus(row.gap);
  return {
    element: row.element,
    background: row.adjustedIdeal,
    foreground: row.current,
    tooltip: `Lý tưởng: ${row.adjustedIdeal.toFixed(2)} · Hiện tại: ${row.current.toFixed(2)}`,
    badge: { label: GAP_LABEL[status], tone: GAP_TONE[status] },
  };
}

interface ElementVectorFitProps {
  analysis: WorkspaceElementAnalysis;
  /** full: trang Workspace · compact: mini trên card / dropdown switcher */
  variant?: "full" | "compact";
}

export default function ElementVectorFit({ analysis, variant = "full" }: ElementVectorFitProps) {
  const orderedRows = toOrderedRows(analysis.elements);
  const dominantVi = elementVi(analysis.dominantNeed);
  const dominantColor = elementColor(analysis.dominantNeed);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#fafbf9] px-3 py-2">
        <ElementBars rows={orderedRows.map(toBarRow)} size="mini" />
        <span className="shrink-0 text-xs text-[#6b7280]">
          Thiếu <span style={{ color: dominantColor }} className="font-semibold">{dominantVi}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafbf9] p-5">
      <h3 className="mb-4 text-sm font-bold text-[#111827]">Ngũ hành không gian của bạn</h3>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-4">
          <ElementTags rows={orderedRows} />
          <SpaceInsightList insights={analysis.insights} />
        </div>
        <ElementRadarChart rows={orderedRows} />
      </div>
    </div>
  );
}
