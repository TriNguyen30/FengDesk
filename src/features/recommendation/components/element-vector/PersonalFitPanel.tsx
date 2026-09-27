import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FitLoadingBanner, { Reveal } from "./FitLoadingBanner";
import { revealContainer } from "./revealVariants";
import { CalendarPlus, Sparkles } from "lucide-react";
import { usePersonalFit } from "../../hooks/useProductFit";
import ScoreBadge from "./ScoreBadge";
import ScoreWaterfall from "./ScoreWaterfall";
import OccupationDirectionPanel from "./OccupationDirectionPanel";
import { ClashBadge } from "./ClashNotices";
import {
  CAUTION_CLASS,
  ELEMENT_ORDER,
  FIT_TONES,
  cautionTone,
  clashesDestiny,
  elementColor,
  elementVi,
} from "./constants";
import { RadarTooltipFrame, TooltipRow } from "./RadarTooltipFrame";
import { makeElementAxisTick, radarTooltipProps } from "./radarHelpers";
import { useAnchoredPopover } from "./useAnchoredPopover";
import { toMap } from "../../lib/breakdown";

interface PersonalFitPanelProps {
  productId: string;
}

/**
 * Vị trí #3 cho vật phẩm **mang theo người** — R3.
 *
 * **Cố ý không dùng lại `ProductFitPanel`.** Luồng này khác về bản chất chứ không chỉ khác dữ liệu:
 * không có phòng ⇒ không có "Mức lý tưởng"/"Hiện tại"/"Xem trước", không có gap, không có hướng đặt,
 * và waterfall chỉ **một** thành phần thay vì hai thành phần + trọng số. Nhét vào cùng component sẽ
 * đầy nhánh `if` và sớm muộn hiện nhầm nhãn của luồng phòng cho vật đeo trên người.
 */
export default function PersonalFitPanel({ productId }: PersonalFitPanelProps) {
  const { fit, status, error } = usePersonalFit(productId);

  if (status === "pending") {
    return (
      <FitLoadingBanner
        label="Đang đối chiếu với bản mệnh của bạn…"
        hint="Hệ thống đang tính dụng thần từ ngày sinh và so với ngũ hành của vật phẩm."
      />
    );
  }

  // Thiếu ngày sinh (422) là trường hợp thường gặp nhất, và nó có hành động rõ ràng — mời khai ngày
  // sinh thay vì báo "không tải được".
  if (status === "error" || !fit) {
    return <MissingBirthDateState message={messageOf(error)} />;
  }

  const need = toMap(fit.personalNeedVector);
  const product = toMap(fit.productVector);
  const occupation = fit.breakdown?.vectors.occupationDirection
    ? toMap(fit.breakdown.vectors.occupationDirection)
    : null;
  const wo = fit.breakdown?.occupation?.weight ?? 0;
  const minorClash =
    fit.breakdown?.penalties.find((p) => p.code === "MINOR_CLASH_PENALTY" && p.applied) ?? null;
  const data = ELEMENT_ORDER.map((element) => ({
    element,
    label: elementVi(element),
    need: need[element],
    product: product[element],
    occ: occupation?.[element] ?? 0,
  }));
  const domainMax = Math.max(0.45, ...data.flatMap((d) => [d.need, d.product]));

  // Cùng icon/vị trí tick với radar phòng (`makeElementAxisTick`); dấu ở đây là "khắc mệnh" thay vì thừa/thiếu.
  const labelToElement = Object.fromEntries(data.map((d) => [d.label, d.element]));
  // v3.6: hành nên tránh (kỵ thần Tứ Trụ / khắc bản mệnh) chỉ đổi MÀU icon sang đỏ — không gắn dấu.
  // Một dấu ✕ cạnh hành đọc như "bị gạch", trong khi đây là lời khuyên nên tránh, không phải điểm trừ.
  const avoidSet = new Set<string>(fit.personalAvoidElements ?? []);
  const axisTick = makeElementAxisTick(labelToElement, undefined, (e) =>
    avoidSet.has(e) || clashesDestiny(e, fit.destinyElement) ? "#b94a47" : undefined,
  );

  // Dụng thần: các hành > 0, giảm dần — "Thổ 60% · Kim 40%".
  const needChips = ELEMENT_ORDER.filter((e) => need[e] > 0.005)
    .sort((a, b) => need[b] - need[a])
    .map((e) => `${elementVi(e)} ${Math.round(need[e] * 100)}%`);

  const radarAside = (
    <div className="min-w-0">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} outerRadius="80%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="label" tick={axisTick} />
          <PolarRadiusAxis type="number" domain={[0, domainMax]} tick={false} axisLine={false} />
          <Radar
            name="Dụng thần của bạn"
            dataKey="need"
            stroke="#D9AD41"
            strokeWidth={2}
            fill="#D9AD41"
            fillOpacity={0.22}
            dot={false}
            isAnimationActive
            animationDuration={600}
          />
          <Radar
            name="Sản phẩm"
            dataKey="product"
            stroke="#7d8f69"
            strokeWidth={2}
            fill="#7d8f69"
            fillOpacity={0.18}
            dot
            isAnimationActive
            animationDuration={600}
          />
          <Tooltip
            content={
              <NeedTooltip
                destiny={fit.destinyElement}
                avoid={fit.personalAvoidElements ?? []}
                wo={wo}
                occupationName={fit.breakdown?.occupation?.nameVi ?? null}
                minorClashParam={minorClash?.paramValue ?? null}
              />
            }
            {...radarTooltipProps()}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[13px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#D9AD41]/80" />
          Dụng thần của bạn
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#7d8f69]/80" />
          Sản phẩm
        </span>
        <span className="w-full text-center text-xs text-gray-400">
          Di chuột vào đồ thị để xem chi tiết
        </span>
      </div>

      {fit.breakdown && (
        <div className="mt-3">
          <OccupationDirectionPanel breakdown={fit.breakdown} />
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-sm font-extrabold text-gray-900">
          Độ phù hợp với bản mệnh của bạn
        </span>
      </div>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        {/* Dữ liệu về → các khối mở lần lượt (cùng hiệu ứng với ProductFitPanel). */}
        <motion.div
          variants={revealContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-5"
        >
          <Reveal className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <ScoreBadge score={fit.score} />
              <ClashBadge breakdown={fit.breakdown} />
            </div>
            <div className="text-right">
              <div className="text-[13px] text-gray-400">Bản mệnh</div>
              <div className="text-sm font-semibold text-gray-700">{fit.destinyLabelVi}</div>
            </div>
          </Reveal>

          {/* Một hộp chung: trái = radar dụng thần ↔ sản phẩm + trục nghề, phải = dụng thần + điểm đến từ đâu. */}
          <Reveal>
            {fit.breakdown ? (
              <ScoreWaterfall
                breakdown={fit.breakdown}
                matchFacts={fit.matchFacts}
                cautionFacts={fit.cautionFacts}
                aside={radarAside}
                lead={
                  <NeedCard
                    chips={needChips}
                    avoid={fit.personalAvoidElements ?? []}
                    source={fit.personalNeedSource}
                    note={fit.personalNeedNoteVi}
                    need={need}
                    destinyLabel={fit.destinyLabelVi}
                  />
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 md:items-start">
                {radarAside}
                <div className="flex flex-col gap-2">
                  <NeedCard
                    chips={needChips}
                    avoid={fit.personalAvoidElements ?? []}
                    source={fit.personalNeedSource}
                    note={fit.personalNeedNoteVi}
                    need={need}
                    destinyLabel={fit.destinyLabelVi}
                  />
                  {fit.matchFacts.length > 0 && (
                    <ul className="space-y-1 text-[13px] leading-relaxed text-gray-600">
                      {fit.matchFacts.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  )}
                  {fit.cautionFacts.map((c, i) => (
                    <p
                      key={i}
                      className={`rounded-lg px-3 py-2 text-[13px] leading-relaxed ${CAUTION_CLASS[cautionTone(c)]}`}
                    >
                      {c}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Tooltip từng hành — cùng khung với radar phòng (`RadarTooltipFrame`), thân là phép tính của chính
 * hành đó: dụng thần cần × sản phẩm cấp = phần góp vào `n̂·p`, nhân trọng số `1 − Wo`; nếu có nghề thì
 * thêm `ô[e]·p[e]·Wo`; hành khắc bản mệnh thì thêm dòng phạt `MINOR_CLASH × p[e]`. Cộng năm tooltip lại
 * ra đúng các dòng của waterfall bên phải.
 */
interface NeedTooltipProps {
  /** Recharts bơm vào khi hover — chỉ đọc `payload[0].payload`, còn lại là dữ liệu tự truyền. */
  active?: boolean;
  payload?: { payload?: NeedTooltipRow }[];
  destiny: string | null;
  avoid: string[];
  wo: number;
  occupationName: string | null;
  minorClashParam: number | null;
}
interface NeedTooltipRow {
  element: string;
  need: number;
  product: number;
  occ: number;
}

function NeedTooltip({
  active,
  payload,
  destiny,
  avoid,
  wo,
  occupationName,
  minorClashParam,
}: NeedTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  // v3.6: hành nên tránh (kỵ thần) — phần sản phẩm mang hành đó không được tính là hợp (avoidHit);
  // hành khắc mệnh ngoài kỵ mới đi qua MINOR_CLASH.
  const isAvoid = avoid.includes(row.element);
  const clash = !isAvoid && clashesDestiny(row.element, destiny);
  const cover = Math.min(row.need, row.product);
  const needShare = isAvoid ? -row.product : cover;
  const needWeighted = needShare * (1 - wo);
  const occShare = wo > 0 ? row.occ * row.product * wo : 0;
  const penalty =
    clash && minorClashParam != null && row.product > 0 ? minorClashParam * row.product : 0;

  const tone =
    (isAvoid || clash) && row.product > 0
      ? FIT_TONES[4]
      : row.need > 0 && row.product > 0
        ? FIT_TONES[0]
        : row.need > 0
          ? FIT_TONES[2]
          : FIT_TONES[1];
  const pill =
    isAvoid && row.product > 0
      ? "Hành bạn nên tránh - có trong vật này"
      : clash && row.product > 0
        ? "Khắc bản mệnh - chưa hợp với bạn"
        : row.need > 0 && row.product > 0
          ? "Bồi đúng hành bạn đang cần"
          : row.need > 0
            ? "Bạn đang cần, vật này chưa có"
            : isAvoid
              ? "Hành nên tránh - vật này không có"
              : "Không ảnh hưởng tới bạn";

  const num = (x: number, d = 3) => x.toFixed(d);
  const s3 = (x: number) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(3);

  return (
    <RadarTooltipFrame
      element={row.element}
      tone={tone}
      pillLabel={pill}
      width={220}
      badge={
        isAvoid ? (
          <span className="text-[#b94a47]">nên tránh</span>
        ) : clash ? (
          <span className="text-[#b94a47]">khắc mệnh</span>
        ) : undefined
      }
    >
      <TooltipRow label="Bạn cần" value={num(row.need, 2)} />
      <TooltipRow label="Vật này mang" value={num(row.product)} />
      {!isAvoid && <TooltipRow label="Đáp ứng được" value={num(cover)} muted />}
      <TooltipRow
        label="Ảnh hưởng tới mức phù hợp"
        value={s3(wo > 0 ? needWeighted : needShare)}
        strong
      />
      {wo > 0 && occupationName && (
        <>
          <div className="border-t border-black/10 pt-1.5">
            <TooltipRow
              label={`Nghề ${occupationName} cần`}
              value={(row.occ >= 0 ? "+" : "") + num(row.occ, 2)}
            />
          </div>
          <TooltipRow label="Ảnh hưởng (nghề)" value={s3(occShare)} strong />
        </>
      )}
      {penalty > 0 && (
        <div className="rounded-lg bg-[#fdecea] px-2 py-1.5 text-xs leading-snug text-[#b3261e]">
          Phần khắc bản mệnh, chưa hợp với bạn: {s3(-penalty)}
        </div>
      )}
      <p className="text-[11px] text-slate-400">
        Phép tính đầy đủ: bấm vào dòng tương ứng ở "Điểm này đến từ đâu?".
      </p>
    </RadarTooltipFrame>
  );
}

/**
 * Thẻ "Dụng thần của bạn" — cùng dữ liệu với đa giác vàng trên radar, đặt cạnh waterfall để user thấy
 * ngay `n̂` là gì trước khi đọc dòng "Hợp dụng thần = n̂·p". Hover ra nguồn gốc của các con số:
 * dụng thần lấy từ Tứ Trụ (có giờ sinh) hay Nạp Âm (chỉ năm sinh), và vì sao hành chính nặng hơn hành phụ.
 */
function NeedCard({
  chips,
  avoid,
  source,
  note,
  need,
  destinyLabel,
}: {
  chips: string[];
  avoid: string[];
  source: string;
  note: string;
  need: Record<string, number>;
  destinyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  // Thẻ nằm trong cột cuộn của hộp điểm ⇒ popover `fixed` (xem useAnchoredPopover).
  const { anchorRef, style } = useAnchoredPopover<HTMLDivElement>(open, {
    width: 300,
    align: "left",
    onClose: () => setOpen(false),
  });
  const isTuTru = source === "TuTru";
  const ranked = ELEMENT_ORDER.filter((e) => (need[e] ?? 0) > 0.005).sort(
    (a, b) => need[b] - need[a],
  );

  return (
    <div
      ref={anchorRef}
      className="rounded-xl border border-[#D9AD41]/40 bg-[#D9AD41]/[0.07] px-3 py-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <div className="flex items-center gap-1.5 font-semibold text-[#7a5f1c]">
        <Sparkles size={13} />
        Dụng thần của bạn
        <span className="ml-auto text-[11px] font-medium text-[#8a6d1f]">
          {isTuTru ? "Tứ Trụ" : "Nạp Âm"}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700"
          >
            {c}
          </span>
        ))}
        {avoid.length > 0 && (
          <>
            <span className="ml-1 text-[11px] uppercase tracking-wide text-gray-400">
              nên tránh
            </span>
            {avoid.map((e) => (
              <span
                key={e}
                className="rounded-full border border-[#b94a47]/40 bg-[#fdecea] px-2 py-0.5 text-xs font-medium text-[#b3261e]"
              >
                {elementVi(e)}
              </span>
            ))}
          </>
        )}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-gray-600">{note}</p>

      <AnimatePresence>
        {open && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="scroll-fade overflow-y-auto rounded-xl border border-[#D9AD41]/60 p-3 text-xs text-slate-700 shadow-lg backdrop-blur-[3px]"
            style={{ ...style, background: "rgba(255,255,255,0.97)" }}
          >
            <p className="mb-1.5 font-semibold text-slate-900">Các con số này từ đâu?</p>
            {isTuTru ? (
              <p className="leading-snug">
                <b>Tứ Trụ</b> (năm/tháng/ngày/giờ). Nhật chủ mạnh hay yếu quyết định hành nào cần
                bồi - đó là <b>dụng thần</b>, không nhất thiết trùng bản mệnh {destinyLabel}.
              </p>
            ) : (
              <p className="leading-snug">
                <b>Nạp Âm</b>: bản mệnh {destinyLabel} là hành chính, hành sinh ra mệnh là hành phụ.
                Thêm giờ sinh trong hồ sơ để tính dụng thần Tứ Trụ chính xác hơn.
              </p>
            )}
            <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1">
              <span className="col-span-3 text-[11px] uppercase tracking-wide text-slate-400">
                Tỉ trọng (n̂, Σ = 100%)
              </span>
              {ranked.map((e, i) => (
                <span key={e} className="contents">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: elementColor(e) }}
                    />
                    {elementVi(e)}
                  </span>
                  <span className="text-slate-500">
                    {i === 0 ? "hành cần bồi chính" : "hành phụ"}
                  </span>
                  <span className="text-right font-medium tabular-nums text-slate-800">
                    {Math.round(need[e] * 100)}%
                  </span>
                </span>
              ))}
            </div>
            {avoid.length > 0 && (
              <p className="mt-2 leading-snug">
                <b>Hành nên tránh</b> ({avoid.map(elementVi).join(", ")}):{" "}
                {isTuTru
                  ? "theo Tứ Trụ đây là những hành làm hao hoặc khắc nhật chủ của bạn"
                  : "hành khắc bản mệnh của bạn"}
                . Vật mang nhiều hành này sẽ chưa thật hợp với bạn. Các hành còn lại không ảnh
                hưởng.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MissingBirthDateState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D9AD41]/50 bg-[#D9AD41]/[0.07] p-6 text-center">
      <CalendarPlus size={22} className="mx-auto text-[#8a6d1f]" />
      <p className="mt-2 text-sm font-semibold text-gray-800">
        Cần ngày sinh để chấm vật phẩm mang theo người
      </p>
      <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-gray-500">{message}</p>
      <a
        href="/profile"
        className="mt-3 inline-block rounded-full bg-[#D9AD41] px-4 py-1.5 text-[13px] font-semibold text-white"
      >
        Thêm ngày sinh
      </a>
    </div>
  );
}

/** Ưu tiên câu BE gửi kèm — nó nói rõ thiếu gì và cần làm gì hơn bất kỳ câu chung chung nào. */
function messageOf(error: unknown): string {
  const fallback =
    "Bổ sung ngày sinh (và giờ sinh nếu có) trong hồ sơ để hệ thống tính được dụng thần của bạn.";
  if (typeof error !== "object" || error === null) return fallback;

  const data = (error as { response?: { data?: { message?: unknown } } }).response?.data;
  return typeof data?.message === "string" && data.message.trim() ? data.message : fallback;
}
