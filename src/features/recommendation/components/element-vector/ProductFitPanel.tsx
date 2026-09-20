import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useWorkspaces } from "@/features/users/hooks/useWorkspace";
import { useProductFitAcrossWorkspaces } from "../../hooks/useProductFit";
import type { ProductFitResponse } from "../../types/recommendation";
import type { ElementAnalysisRow as RadarRow } from "@/features/users/types/workspace";
import ScoreBadge from "./ScoreBadge";
import ElementRadarChart from "./ElementRadarChart";
import SpaceTabs from "./SpaceTabs";
import EmptyState from "./EmptyState";
import ScoreWaterfall from "./ScoreWaterfall";
import RoomNeedCard from "./RoomNeedCard";
import InfoCardTrio from "./InfoCardTrio";
import FitLoadingBanner, { Reveal } from "./FitLoadingBanner";
import { revealContainer } from "./revealVariants";
import { lightingVi, workPurposeVi } from "./workspaceLabels";
import { ClashBadge, ConflictResolutionBanner } from "./ClashNotices";
import OccupationDirectionPanel from "./OccupationDirectionPanel";
import { CAUTION_CLASS, ELEMENT_ORDER, cautionTone, elementVi, scorePercent } from "./constants";
import type { ElementCode } from "../../types/recommendation";
import {
  combinedDirection,
  negativeAxes,
  negativeAxisReason,
  occupationAxisOf,
  personContribution,
  toMap,
  toRows,
} from "../../lib/breakdown";

interface ProductFitPanelProps {
  productId: string;
}

/**
 * Vị trí #3 (Chi tiết sản phẩm) — luồng **phòng**: SpaceTabs + ScoreBadge, rồi hai cột cùng bố cục với
 * `PersonalFitPanel`: trái = radar (+ trục nghề), phải = thẻ "Phòng đang cần" + waterfall.
 *
 * Đã bỏ thanh ngũ hành và slider trọng số bản mệnh (2026-09-20): 5 thanh chỉ lặp lại radar, còn slider
 * là công cụ mô phỏng — ở trang sản phẩm nó khiến user tưởng trọng số là thứ mình chỉnh được.
 */
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
    return (
      <FitLoadingBanner
        label="Đang tải các không gian của bạn…"
        hint="Lấy danh sách phòng để chấm độ phù hợp của sản phẩm với từng phòng."
      />
    );
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
        {/* Chờ → banner "đang tính" (cùng kiểu với AI điền giúp); có dữ liệu → các khối mở lần lượt.
            `mode="wait"`: banner mờ đi xong mới mở bảng, không chồng hai trạng thái lên nhau. */}
        <AnimatePresence mode="wait" initial={false}>
          {fitStatus === "pending" && (
            <FitLoadingBanner
              key="loading"
              label="Đang tính độ phù hợp với không gian của bạn…"
              hint="Hệ thống đang đọc hiện trạng phòng, bản mệnh và ngũ hành của sản phẩm."
            />
          )}

          {fitStatus === "error" && (
            <p key="error" className="text-sm text-gray-400">
              Không thể tải độ phù hợp cho không gian này.
            </p>
          )}

          {fit && (
            <motion.div
              key={selectedId ?? "fit"}
              variants={revealContainer}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="flex flex-col gap-5"
            >
              <Reveal className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <ScoreBadge score={fit.score} />
                  {/* Badge phạm trù, tách khỏi %: 61% "Phù hợp" vẫn có thể là hàng khắc mệnh. */}
                  <ClashBadge breakdown={fit.breakdown} />
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Không gian</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {selectedWorkspace.name}
                  </div>
                </div>
              </Reveal>

              {/* Một hộp chung: trái = radar (nét đứt = phòng sau khi thêm sản phẩm) + trục nghề, phải = điểm
                đến từ đâu — cùng bố cục với PersonalFitPanel. */}
              <Reveal>
                {fit.breakdown ? (
                  <ScoreWaterfall
                    breakdown={fit.breakdown}
                    matchFacts={fit.matchFacts}
                    cautionFacts={fit.cautionFacts}
                    aside={<RoomRadarAside fit={fit} />}
                    lead={
                      <RoomNeedCard
                        workspaceName={selectedWorkspace.name}
                        gap={fit.gap}
                        breakdown={fit.breakdown}
                        evidenceCount={fit.evidenceCount}
                      />
                    }
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 md:items-start">
                    <RoomRadarAside fit={fit} />
                    <div className="flex flex-col gap-2">
                      <RoomNeedCard
                        workspaceName={selectedWorkspace.name}
                        gap={fit.gap}
                        breakdown={fit.breakdown}
                        evidenceCount={fit.evidenceCount}
                      />
                      {fit.matchFacts.length > 0 && (
                        <ul className="space-y-1 text-xs leading-relaxed text-gray-600">
                          {fit.matchFacts.map((f, i) => (
                            <li key={i}>• {f}</li>
                          ))}
                        </ul>
                      )}
                      {fit.cautionFacts.map((c, i) => (
                        <p
                          key={i}
                          className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${CAUTION_CLASS[cautionTone(c)]}`}
                        >
                          {c}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </Reveal>

              {/* Hàng thông tin DƯỚI hộp điểm: 3 dòng phòng/mệnh/hướng đặt bên trái; bên phải là banner "ưu
                tiên hành X để cân bằng" — chỉ khi có xung mệnh ↔ phòng, và co theo nội dung (`items-start`)
                chứ không kéo dài theo ô. Không có banner thì 3 dòng trải hết chiều ngang. */}
              <Reveal
                className={`grid gap-4 ${fit.breakdown?.conflictResolution ? "md:grid-cols-2 md:items-start" : ""}`}
              >
                <InfoCardTrio
                  spaceTitle={selectedWorkspace.name}
                  spaceLine={`Mục đích: ${workPurposeVi(selectedWorkspace.workPurpose)} · Ánh sáng: ${lightingVi(selectedWorkspace.lighting)}`}
                  menhLine={findMenhLine(fit)}
                  placementLine={fit.placementHint}
                />
                <ConflictResolutionBanner conflict={fit.breakdown?.conflictResolution ?? null} />
              </Reveal>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Dòng "Hợp với bản mệnh" của InfoCardTrio: câu nào BE nói về mệnh, không có thì nhắc khai ngày sinh. */
function findMenhLine(fit: ProductFitResponse): string {
  const all = [...fit.matchFacts, ...fit.cautionFacts];
  return (
    all.find((f) => f.includes("mệnh")) ?? "Chưa xác định - thiếu ngày sinh trong hồ sơ cá nhân."
  );
}

/** Cột trái của hộp điểm: radar phòng (+ xem trước) và trục nghề. */
function RoomRadarAside({ fit }: { fit: ProductFitResponse }) {
  return (
    <div className="min-w-0">
      <ElementRadarChart
        rows={toRadarRows(fit)}
        showPreview
        contributions={fit.contributions ?? []}
        tagVotesScale={fit.tagVotesScale ?? 1}
        {...radarPersonalLayer(fit)}
      />
      <p className="mt-1 text-center text-[11px] text-gray-400">
        Nét đứt = ngũ hành phòng sau khi thêm sản phẩm này
      </p>
      {fit.evidenceCount === 0 && (
        <p className="mt-2 rounded-lg bg-white px-3 py-2 text-[11px] leading-snug text-gray-500">
          Hiện trạng phòng đang được suy ra từ loại phòng vì bạn chưa khai màu sắc/vật liệu nào.
          Khai thêm để điểm bám sát không gian thật của bạn.
        </p>
      )}
      {fit.breakdown && (
        <div className="mt-3">
          <OccupationDirectionPanel breakdown={fit.breakdown} />
        </div>
      )}
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
  const deprioritized = negativeAxes(combinedDirection(gHat, r, wp, occupationAxisOf(breakdown)));
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
