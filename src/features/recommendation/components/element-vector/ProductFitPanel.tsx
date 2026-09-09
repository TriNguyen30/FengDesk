import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaces } from "@/features/users/hooks/useWorkspace";
import { useProductFitAcrossWorkspaces } from "../../hooks/useProductFit";
import type { ElementAnalysisRow, ProductFitResponse } from "../../types/recommendation";
import type { ElementAnalysisRow as RadarRow } from "@/features/users/types/workspace";
import ScoreBadge from "./ScoreBadge";
import ElementBars, { type ElementBarRow } from "./ElementBars";
import ElementRadarChart from "./ElementRadarChart";
import InfoCardTrio from "./InfoCardTrio";
import SpaceTabs from "./SpaceTabs";
import EmptyState from "./EmptyState";
import SummaryLine from "./SummaryLine";
import ScoreWaterfall from "./ScoreWaterfall";
import PersonalWeightControls from "./PersonalWeightControls";
import { ClashBadge, ConflictResolutionBanner } from "./ClashNotices";
import { ELEMENT_ORDER, GAP_THRESHOLD, elementVi, scorePercent } from "./constants";
import type { ElementCode } from "../../types/recommendation";
import {
  combinedDirection,
  negativeAxes,
  negativeAxisReason,
  personContribution,
  toMap,
  toRows,
} from "../../lib/breakdown";

interface ProductFitPanelProps {
  productId: string;
}

/** Vị trí #3 (Chi tiết sản phẩm) — cụm đầy đủ: ScoreBadge + ElementBars(fit) + InfoCardTrio + SpaceTabs + SummaryLine. */
export default function ProductFitPanel({ productId }: ProductFitPanelProps) {
  const navigate = useNavigate();
  const { workspaces, status: wsStatus } = useWorkspaces();
  const workspaceIds = workspaces.map((w) => w.id);
  const { byWorkspaceId } = useProductFitAcrossWorkspaces(productId, workspaceIds);

  // null = chưa chọn tay → dùng phòng mặc định (hoặc phòng đầu tiên) làm fallback.
  const [manualSelectedId, setManualSelectedId] = useState<string | null>(null);
  // null = dùng đúng Wp của BE; số = user đang kéo slider mô phỏng (§10.3, không gọi lại API).
  const [simulatedWp, setSimulatedWp] = useState<number | null>(null);
  const fallbackId = workspaces.find((w) => w.isDefault)?.id ?? workspaces[0]?.id ?? null;
  const selectedId =
    manualSelectedId && workspaces.some((w) => w.id === manualSelectedId)
      ? manualSelectedId
      : fallbackId;

  if (wsStatus === "pending") {
    return <div className="h-56 animate-pulse rounded-2xl bg-gray-50" />;
  }

  if (workspaces.length === 0) {
    return <EmptyState onCreateWorkspace={() => navigate("/profile/workspace")} />;
  }

  const selectedWorkspace = workspaces.find((w) => w.id === selectedId) ?? workspaces[0];
  const selectedEntry = selectedId ? byWorkspaceId.get(selectedId) : undefined;
  const fit = selectedEntry?.fit ?? null;
  const fitStatus = selectedEntry?.status ?? "pending";

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-sm font-extrabold text-gray-900">
          Độ phù hợp phong thủy với không gian của bạn
        </span>
      </div>

      <SpaceTabs
        items={workspaces.map((w) => {
          const entry = byWorkspaceId.get(w.id);
          const pct = entry?.fit ? scorePercent(entry.fit.score) : null;
          return { id: w.id, name: w.name, percent: pct };
        })}
        selectedId={selectedId}
        onSelect={setManualSelectedId}
        onAddNew={() => navigate("/profile/workspace")}
      />

      <div className="rounded-b-2xl rounded-tr-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        {fitStatus === "pending" && <div className="h-48 animate-pulse rounded-xl bg-gray-50" />}

        {fitStatus === "error" && (
          <p className="text-sm text-gray-400">Không thể tải độ phù hợp cho không gian này.</p>
        )}

        {fit && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <ScoreBadge score={fit.score} />
                {/* Badge phạm trù, tách khỏi %: 61% "Phù hợp" vẫn có thể là hàng khắc mệnh. */}
                <ClashBadge breakdown={fit.breakdown} />
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Không gian</div>
                <div className="text-sm font-semibold text-gray-700">{selectedWorkspace.name}</div>
              </div>
            </div>

            <ConflictResolutionBanner conflict={fit.breakdown?.conflictResolution ?? null} />

            {/* Radar (trái) cho thấy phòng SẼ ra sao khi thêm sản phẩm này (nét đứt = xem trước);
                thanh ngũ hành (phải) giữ chi tiết bù/thừa từng hành — tận dụng chiều ngang. */}
            <div className="grid gap-4 md:grid-cols-2 md:items-center">
              <div className="min-w-0">
                <ElementRadarChart
                  rows={toRadarRows(fit)}
                  showPreview
                  contributions={fit.contributions ?? []}
                  {...radarPersonalLayer(fit)}
                />
                <p className="mt-1 text-center text-[11px] text-gray-400">
                  Nét đứt = ngũ hành phòng sau khi thêm sản phẩm này
                </p>
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <ElementBars rows={toFitBarRows(fit)} />
                {fit.breakdown && (
                  <PersonalWeightControls
                    breakdown={fit.breakdown}
                    simulatedWp={simulatedWp}
                    onSimulate={setSimulatedWp}
                  />
                )}
              </div>
            </div>

            {fit.breakdown && <ScoreWaterfall breakdown={fit.breakdown} />}

            {fit.evidenceCount === 0 && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] leading-snug text-gray-500">
                Hiện trạng phòng đang được suy ra từ loại phòng vì bạn chưa khai màu sắc/vật liệu nào.
                Khai thêm để điểm bám sát không gian thật của bạn.
              </p>
            )}

            {fit.cautionFacts.length > 0 && (
              <div className="rounded-lg bg-[#fdecea] px-3 py-2 text-xs text-[#b3261e]">
                {fit.cautionFacts.map((c, i) => (
                  <p key={i}>{c}</p>
                ))}
              </div>
            )}

            <InfoCardTrio
              spaceTitle={selectedWorkspace.name}
              spaceLine={`Mục đích: ${selectedWorkspace.workPurpose} · Ánh sáng: ${selectedWorkspace.lighting}`}
              menhLine={findMenhLine(fit)}
              placementLine={fit.placementHint}
            />

            <SummaryLine
              productDominant={dominantElement(fit.productVector.map((p) => [p.element, p.value]))}
              roomNeed={dominantNeed(fit.gap)}
              matches={productMatchesNeed(fit)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Map product-fit → hàng radar theo ĐÚNG thứ tự ELEMENT_ORDER (khớp radar workspace, tránh lệch trục).
 * previewCurrent do BE tính bằng chính engine (BuildCurrentWithProducts) — cùng thang & cùng cơ chế
 * "phiếu" với previewCurrent của workspace, nên radar khớp scale với card workspace.
 */
function toRadarRows(fit: ProductFitResponse): RadarRow[] {
  const gapByElement = new Map(fit.gap.map((r) => [r.element, r]));
  return ELEMENT_ORDER.map((el) => {
    const g = gapByElement.get(el);
    return {
      element: el,
      ideal: g?.ideal ?? 0,
      adjustedIdeal: g?.adjustedIdeal ?? 0,
      current: g?.current ?? 0,
      gap: g?.gap ?? 0,
      previewCurrent: g?.previewCurrent ?? g?.current ?? 0,
      previewGap: g?.previewGap ?? 0,
    };
  });
}

/** Bars fit — cùng thứ tự ELEMENT_ORDER với radar. */
function toFitBarRows(fit: ProductFitResponse): ElementBarRow[] {
  const gapByElement = new Map(fit.gap.map((r) => [r.element, r]));
  const productByElement = new Map(fit.productVector.map((p) => [p.element, p.value]));
  return ELEMENT_ORDER.map((el) => {
    const gap = gapByElement.get(el)?.gap ?? 0;
    const productValue = productByElement.get(el) ?? 0;
    const needed = Math.max(gap, 0);
    let badge: ElementBarRow["badge"];
    if (gap > GAP_THRESHOLD && productValue > 0) {
      badge = { label: "Bù tốt", tone: "positive" };
    } else if (gap < -GAP_THRESHOLD && productValue > 0) {
      badge = { label: "Thêm thừa", tone: "negative" };
    }
    return {
      element: el,
      background: needed,
      foreground: productValue,
      tooltip: `Phòng cần: ${needed.toFixed(2)} · Sản phẩm cấp: ${productValue.toFixed(2)}`,
      badge,
    };
  });
}

function dominantElement(values: [string, number][]): string {
  return values.reduce((best, cur) => (cur[1] > best[1] ? cur : best), values[0] ?? ["Tho", 0])[0];
}

function dominantNeed(gap: ElementAnalysisRow[]): string {
  return dominantElement(gap.map((r) => [r.element, r.gap]));
}

function productMatchesNeed(fit: ProductFitResponse): boolean {
  const need = dominantNeed(fit.gap);
  const productValue = fit.productVector.find((p) => p.element === need)?.value ?? 0;
  return productValue > 0;
}

function findMenhLine(fit: ProductFitResponse): string {
  const all = [...fit.matchFacts, ...fit.cautionFacts];
  const menhFact = all.find((f) => f.includes("mệnh"));
  return menhFact ?? "Chưa xác định — thiếu ngày sinh trong hồ sơ cá nhân.";
}

/**
 * Lớp "Ưu tiên của bạn" + nhãn trục đỏ cho radar — dựng tại client từ `ĝ`, `r` và `Wp`.
 *
 * Kéo slider `Wp` là gọi lại đúng hàm này với `simulatedWp` khác, nên đa giác morph tức thì mà
 * **không gọi lại API** (§10.3). `Wp = 0` thì `d ≡ ĝ` và lớp vàng sẽ trùng khít "Mức lý tưởng" —
 * vẽ chỉ làm rối, nên ẩn hẳn.
 */
function radarPersonalLayer(fit: ProductFitResponse) {
  const breakdown = fit.breakdown;
  const contribution = personContribution(fit.contributions ?? []);
  if (!breakdown || breakdown.target !== "WorkspaceGap" || !contribution) return {};

  const personRow = (fit.contributions ?? []).find((c) => c.source === "Person");
  const votes = personRow?.votes ?? 0;

  const gHat = toMap(breakdown.vectors.normalizedGap);
  const r = breakdown.vectors.ruleScore ? toMap(breakdown.vectors.ruleScore) : null;
  const wp = breakdown.personalWeight?.value ?? 0;
  const deprioritized = negativeAxes(combinedDirection(gHat, r, wp));
  const destinyLabel = breakdown.destinyElement ? elementVi(breakdown.destinyElement) : null;

  return {
    personalTarget: toRows(contribution),
    personalTargetLabel: `${votes % 1 === 0 ? votes : votes.toFixed(1)} phiếu`,
    deprioritizedElements: deprioritized.filter(
      (e) => negativeAxisReason(e, gHat, r, destinyLabel) !== null,
    ) as string[],
    deprioritizedReasons: Object.fromEntries(
      deprioritized
        .map((e) => [e, negativeAxisReason(e, gHat, r, destinyLabel)] as const)
        .filter((pair): pair is readonly [ElementCode, string] => pair[1] !== null),
    ),
  };
}
