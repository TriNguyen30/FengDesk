import { useState } from "react";
import type {
  ElementAnalysisRow,
  WorkspaceElementAnalysis,
} from "@/features/users/types/workspace";
import ElementBars, { type ElementBarRow, type BarTone } from "./ElementBars";
import ElementTags from "./ElementTags";
import SpaceInsightList from "./SpaceInsightList";
import ElementRadarChart from "./ElementRadarChart";
import RoomPersonalWeightControls from "./RoomPersonalWeightControls";
import { ConflictResolutionBanner } from "./ClashNotices";
import { ELEMENT_ORDER, elementColor, elementVi, gapStatus } from "./constants";
import type { ElementCode } from "../../types/recommendation";
import {
  combinedDirection,
  negativeAxes,
  negativeAxisReason,
  personContribution,
  simulateVotes,
  toMap,
  toRows,
  type ElementMap,
} from "../../lib/breakdown";

/** Đảm bảo luôn có đủ 5 hành theo đúng thứ tự hiển thị, kể cả khi BE trả rỗng. */
function toOrderedRows(elements: ElementAnalysisRow[]): ElementAnalysisRow[] {
  const byElement = new Map(elements.map((row) => [row.element, row]));
  return ELEMENT_ORDER.map(
    (element) =>
      byElement.get(element) ??
      { element, ideal: 0, adjustedIdeal: 0, current: 0, gap: 0, previewCurrent: 0, previewGap: 0 },
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
  // null = dùng đúng số phiếu BE trả; số = user đang kéo slider mô phỏng (không gọi lại API).
  const [simulatedVotes, setSimulatedVotes] = useState<number | null>(null);

  const orderedRows = toOrderedRows(analysis.elements);
  const dominantVi = elementVi(analysis.dominantNeed);
  const dominantColor = elementColor(analysis.dominantNeed);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#fafbf9] px-3 py-2">
        <ElementBars rows={orderedRows.map(toBarRow)} size="mini" />
        <span className="shrink-0 text-xs text-[#6b7280]">
          Thiếu{" "}
          <span style={{ color: dominantColor }} className="font-semibold">
            {dominantVi}
          </span>
        </span>
      </div>
    );
  }

  const personVotes = (analysis.contributions ?? []).find((c) => c.source === "Person")?.votes ?? 0;

  // Chủ nhân NẰM TRONG `current`, nên mô phỏng phải dựng lại cả hai lớp cùng lúc — xem `simulateVotes`.
  const personalVector = analysis.personalDirection
    ? toMap(analysis.personalDirection.personalVector)
    : null;
  const simulation =
    simulatedVotes !== null && personalVector
      ? simulateVotes(
          currentOf(orderedRows),
          personalVector,
          personVotes,
          analysis.totalVotes,
          simulatedVotes,
        )
      : null;

  // Mọi thứ đọc `gap` (dấu trục, chip Thừa/Thiếu) phải đọc cùng một `current` với đa giác xanh, không
  // thì chip nói về căn phòng thật còn hình nói về căn phòng giả định.
  const displayRows = simulation
    ? orderedRows.map((row) => {
        const current = simulation.current[row.element as ElementCode];
        const gap = row.adjustedIdeal - current;
        return { ...row, current, gap, previewCurrent: current, previewGap: gap };
      })
    : orderedRows;

  const personalLayer = buildPersonalLayer(analysis, simulation?.person ?? null, simulatedVotes);

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafbf9] p-5">
      <h3 className="mb-4 text-sm font-bold text-[#111827]">Ngũ hành không gian của bạn</h3>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-4">
          <ElementTags rows={displayRows} />
          {(analysis.evidenceCount ?? 0) === 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Đang <strong>ước tính theo loại phòng</strong> - Có vẻ như bạn chưa khai báo màu chủ đạo, chất liệu
              hay vật trang trí nào. Thêm vài tag hiện trạng để phản ánh đúng thực trạng khu vực làm việc của bạn.
            </p>
          )}
          {simulation && (
            <p className="rounded-lg bg-[#D9AD41]/10 px-3 py-2 text-xs text-[#8a6d1f]">
              Đang <strong>xem thử</strong> ở mức {simulatedVotes} phiếu. Biểu đồ và chip ngũ hành đổi
              theo mức này; ba nhận định bên dưới vẫn tính trên số phiếu thật.
            </p>
          )}
          <SpaceInsightList insights={analysis.insights} />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <ElementRadarChart
            rows={displayRows}
            showPreview={analysis.hasPreview && !simulation}
            contributions={analysis.contributions}
            {...personalLayer}
          />
          {analysis.personalDirection && (
            <RoomPersonalWeightControls
              direction={analysis.personalDirection}
              personVotes={personVotes}
              simulatedVotes={simulatedVotes}
              onSimulate={setSimulatedVotes}
            />
          )}
          <ConflictResolutionBanner
            conflict={analysis.personalDirection?.conflictResolution ?? null}
          />
        </div>
      </div>
    </div>
  );
}

/** `current` của phòng dưới dạng map — đầu vào cho {@link simulateVotes}. */
function currentOf(rows: ElementAnalysisRow[]): ElementMap {
  const out: ElementMap = { Kim: 0, Moc: 0, Thuy: 0, Hoa: 0, Tho: 0 };
  for (const row of rows) {
    if (row.element in out) out[row.element as ElementCode] = row.current;
  }
  return out;
}

/**
 * Lớp "Phần của bạn" — phần đóng góp của chủ nhân vào chính vector `Hiện tại`.
 *
 * Trước đây lớp này là `T = (1−Wp)·adjustedIdeal + Wp·personalVector`, một MỤC TIÊU tưởng tượng. Nay
 * bản mệnh đã thật sự là một nguồn phiếu trong `current`, nên vẽ `T` nữa là đếm ảnh hưởng của bản
 * mệnh hai lần. Lớp mới là một phần có thật của phòng, luôn nằm trong lớp "Hiện tại".
 *
 * Lớp này chỉ phụ thuộc **số phiếu**, KHÔNG phụ thuộc `Wp`: hai tham số chạy song song — một cái định
 * lượng bản mệnh trong hiện trạng phòng, một cái định lượng bản mệnh khi chấm sản phẩm.
 *
 * `d < 0` không tô trục (dấu trục đọc từ `gap`), chỉ còn là chú giải trong tooltip.
 */
function buildPersonalLayer(
  analysis: WorkspaceElementAnalysis,
  simulatedPerson: ElementMap | null,
  simulatedVotes: number | null,
) {
  const contribution = simulatedPerson ?? personContribution(analysis.contributions ?? []);
  if (!contribution) return {};

  const realVotes = (analysis.contributions ?? []).find((c) => c.source === "Person")?.votes ?? 0;
  const votes = simulatedVotes ?? realVotes;
  const layer = {
    personalTarget: toRows(contribution),
    personalTargetLabel: `${votes % 1 === 0 ? votes : votes.toFixed(1)} phiếu`,
  };

  // Chú giải "vì sao hành này không được ưu tiên bù" thuộc về trục chấm điểm (Wp), không thuộc lớp vẽ.
  const direction = analysis.personalDirection;
  if (!direction) return layer;

  const gHat = toMap(direction.normalizedGap);
  const r = toMap(direction.ruleScore);
  const deprioritized = negativeAxes(combinedDirection(gHat, r, direction.personalWeight));
  const destinyVi = elementVi(direction.destinyElement);

  return {
    ...layer,
    deprioritizedElements: deprioritized.filter(
      (e) => negativeAxisReason(e, gHat, r, destinyVi) !== null,
    ) as string[],
    deprioritizedReasons: Object.fromEntries(
      deprioritized
        .map((e) => [e, negativeAxisReason(e, gHat, r, destinyVi)] as const)
        .filter((pair): pair is readonly [ElementCode, string] => pair[1] !== null),
    ),
  };
}
