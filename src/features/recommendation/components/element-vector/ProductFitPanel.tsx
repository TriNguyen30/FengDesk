import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaces } from "@/features/users/hooks/useWorkspace";
import { useProductFitAcrossWorkspaces } from "../../hooks/useProductFit";
import type { ElementAnalysisRow, ProductFitResponse } from "../../types/recommendation";
import ScoreBadge from "./ScoreBadge";
import ElementBars, { type ElementBarRow } from "./ElementBars";
import InfoCardTrio from "./InfoCardTrio";
import SpaceTabs from "./SpaceTabs";
import EmptyState from "./EmptyState";
import SummaryLine from "./SummaryLine";
import { GAP_THRESHOLD, scorePercent } from "./constants";

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
        {fitStatus === "pending" && (
          <div className="h-48 animate-pulse rounded-xl bg-gray-50" />
        )}

        {fitStatus === "error" && (
          <p className="text-sm text-gray-400">Không thể tải độ phù hợp cho không gian này.</p>
        )}

        {fit && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <ScoreBadge score={fit.score} />
              <div className="text-right">
                <div className="text-xs text-gray-400">Không gian</div>
                <div className="text-sm font-semibold text-gray-700">{selectedWorkspace.name}</div>
              </div>
            </div>

            <ElementBars rows={toFitBarRows(fit)} />

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

function toFitBarRows(fit: ProductFitResponse): ElementBarRow[] {
  const productByElement = new Map(fit.productVector.map((p) => [p.element, p.value]));
  return fit.gap.map((row) => {
    const productValue = productByElement.get(row.element) ?? 0;
    const needed = Math.max(row.gap, 0);
    let badge: ElementBarRow["badge"];
    if (row.gap > GAP_THRESHOLD && productValue > 0) {
      badge = { label: "Bù tốt", tone: "positive" };
    } else if (row.gap < -GAP_THRESHOLD && productValue > 0) {
      badge = { label: "Thêm thừa", tone: "negative" };
    }
    return {
      element: row.element,
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
