import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Dot, Minus, Plus, TriangleAlert } from "lucide-react";
import type {
  ProductElementRow,
  ScoreBreakdown,
  ScoreComponentRow,
  ScorePenaltyRow,
} from "../../types/recommendation";
import { toMap } from "../../lib/breakdown";
import {
  CAUTION_CLASS,
  CONTROLS,
  ELEMENT_ORDER,
  cautionTone,
  elementColor,
  elementVi,
} from "./constants";
import { seamLine, seamWash } from "@/utils/seamGlow";
import { useAnchoredPopover } from "./useAnchoredPopover";

interface ScoreWaterfallProps {
  breakdown: ScoreBreakdown;
  /** "Sự thật" khớp (BE `matchFacts`) — hiện ngay dưới "Điểm cuối", đọc như phần kết luận của waterfall. */
  matchFacts?: string[];
  /** Lưu ý (BE `cautionFacts`) — cùng chỗ; đỏ khi chạm bản mệnh, vàng cho phần còn lại (`cautionTone`). */
  cautionFacts?: string[];
  /**
   * Cột trái đặt CHUNG trong hộp với waterfall (radar + trục nghề). Hai hộp rời — radar một bên, điểm một
   * bên — cao thấp lệch nhau vì nội dung khác nhau; gom vào một hộp thì viền chung, mắt đọc thành một
   * khối "đồ thị ↔ con số" thay vì hai thẻ chênh nhau.
   */
  aside?: ReactNode;
  /**
   * Khối đứng ĐẦU cột phải, trên các dòng điểm (thẻ "Phòng đang cần" / "Dụng thần của bạn"). Đặt ở đây
   * thay vì một hàng riêng phía trên hộp để cột phải lấp được khoảng trống dưới waterfall.
   */
  lead?: ReactNode;
}

/**
 * Waterfall dưới `ScoreBadge` — R1: **thành phần nào tạo ra con số hiển thị**.
 *
 * Đọc từ trên xuống là đúng thứ tự engine tính: từng thành phần cộng vào, rồi từng penalty trừ ra,
 * ra đúng con số trên badge. Số ở đây là số của BE, FE không tính lại — nếu tự tính, hai bên sẽ lệch
 * cách làm tròn và user thấy waterfall không cộng ra điểm.
 *
 * Mỗi dòng có **ba mức chi tiết**, tách ra ba cử chỉ khác nhau (đổi 25/09 — phản hồi "quá nhiều chữ,
 * thiếu trực quan"): mặc định chỉ tên + con số; **hover** bung câu giải thích; **click** ra phép tính
 * đầy đủ. Trước đây câu giải thích luôn hiện và phép tính bám hover — thành ra nhìn vào là một bức
 * tường chữ, mà rê chuột ngang qua thì popover nhảy loạn.
 *
 * Phép tính: số hạng là tích trong `d·p` nên popover liệt kê từng hành `d[e] × p[e]`, cộng lại ra đúng
 * `value`, rồi nhân trọng số ra `contribution`. Vector `d`/`p` lấy từ `breakdown.vectors` (BE trả), FE
 * chỉ nhân lại để **minh hoạ** — nếu tổng lệch `value` quá 0.001 là FE đang đọc sai vector, không phải
 * BE sai.
 *
 * Bố cục: phần giải thích điểm **luôn mở**; hai câu kết luận đứng ngay dưới "Điểm cuối"; danh sách
 * "đã xét, không trừ" — lặp y hệt ở mọi sản phẩm cùng loại — gập lại, mặc định đóng; bung ra mà tràn
 * chiều cao cột thì cột phải cuộn dọc (xem chú thích tại chỗ). Vẫn liệt kê **mọi**
 * penalty kể cả loại không bị áp: "đã xét và không trừ" khác hẳn "không tồn tại".
 */
export default function ScoreWaterfall({
  breakdown,
  matchFacts = [],
  cautionFacts = [],
  aside,
  lead,
}: ScoreWaterfallProps) {
  // Mặc định MỞ (yêu cầu 21/09): cột phải cao bằng cột trái, danh sách dài thì cột cuộn dọc.
  const [skippedOpen, setSkippedOpen] = useState(true);
  const appliedPenalties = breakdown.penalties.filter((p) => p.applied);
  // Dòng CUỐI không vẽ vạch ngăn — dưới nó đã là đường kẻ của khối "Mức độ phù hợp".
  const rowCount = breakdown.components.length + appliedPenalties.length;
  const skippedPenalties = breakdown.penalties.filter((p) => !p.applied);
  const product = toMap(breakdown.vectors.product);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="text-[14px] font-semibold text-gray-700">Điểm này đến từ đâu?</span>
        <span className="flex items-center gap-2 text-[12px] text-gray-400">
          {/* Đóng dấu phiên bản: phiên gợi ý cũ lưu điểm của công thức cũ, không so trực tiếp với điểm hôm nay. */}
          <span
            title={`Công thức phiên bản ${breakdown.formulaVersion}. Phiên gợi ý đã lưu ở phiên bản khác có điểm không so sánh trực tiếp với điểm này.`}
          >
            v{breakdown.formulaVersion}
          </span>
        </span>
      </div>

      <div
        className={`border-t border-gray-200 px-3 py-3 ${aside ? "grid gap-4 md:grid-cols-2" : ""}`}
      >
        {aside && <div className="min-w-0">{aside}</div>}
        {/* Cột phải: chiều cao CỦA CỘT TRÁI quyết định chiều cao hàng (ô phải `absolute` nên không góp
            chiều cao). Chỉ cuộn DỌC: `-inset-x-2 px-2` chừa chỗ cho `-mx-2` của các dòng hover, nếu không
            phần lố 8px mỗi bên sẽ sinh ra thanh cuộn ngang; `overflow-x-hidden` chốt chặn thêm.
            Nội dung dài hơn thì cuộn bên trong. Cuộn có snap "đỉnh/đáy": chỉ hai điểm dừng —
            đầu (`snap-start` ở khối trên) và cuối (`snap-end` ở khối dưới) - nên kéo là về hẳn một trong hai
            mặt, không dừng nửa chừng che mất một dòng. Dưới md (một cột) không giới hạn, trải bình thường. */}
        <div className={aside ? "min-w-0 md:relative md:min-h-[200px]" : "min-w-0"}>
          <div
            className={
              aside
                ? "scroll-fade md:absolute md:inset-y-0 md:-inset-x-2 md:overflow-y-auto md:overflow-x-hidden md:px-2 md:snap-y md:snap-mandatory"
                : ""
            }
          >
            <div className="snap-start">
              {lead && <div className="mb-3">{lead}</div>}
              {/* `-mx-2` ở ĐÂY chứ không ở từng dòng: vạch ngăn phải chạy hết bề ngang cột, thụt vào
                  8px mỗi bên sẽ đọc như gạch chân của chữ thay vì khe giữa hai dòng. */}
              <ul className="-mx-2">
                {breakdown.components.map((c, i) => (
                  <BreakdownRow
                    key={c.code}
                    last={i === rowCount - 1}
                    tone={toneKey(c.contribution)}
                    detail={c.reasonVi}
                    calc={<ComponentCalc component={c} breakdown={breakdown} product={product} />}
                    headline={
                      <>
                        <span
                          className={`flex min-w-0 items-center gap-1.5 font-medium ${toneOf(c.contribution).text}`}
                        >
                          {/* Dấu theo DẤU của số hạng: "hành nên tránh" là số hạng âm — vẽ dấu + cho nó là nói
                              ngược. Số hạng bằng 0 không cộng cũng không trừ ⇒ chấm xám, không phải dấu +. */}
                          {toneOf(c.contribution).icon}
                          <span className="truncate">{c.labelVi}</span>
                        </span>
                        <span className="shrink-0 text-[0.92em] tabular-nums text-gray-600">
                          {Math.abs(c.value).toFixed(3)}
                          <span className="text-gray-400"> × {c.weight.toFixed(2)} = </span>
                          <span className={`font-semibold ${toneOf(c.contribution).value}`}>
                            {signed(c.contribution)}
                          </span>
                        </span>
                      </>
                    }
                  />
                ))}

                {appliedPenalties.map((p, i) => (
                  <BreakdownRow
                    key={p.code}
                    last={breakdown.components.length + i === rowCount - 1}
                    tone="negative"
                    detail={p.reasonVi}
                    calc={<PenaltyCalc penalty={p} breakdown={breakdown} product={product} />}
                    headline={
                      <>
                        <span className="flex min-w-0 items-center gap-1.5 font-medium text-negative">
                          <Minus size={12} className="shrink-0" />
                          <span className="truncate">{p.labelVi}</span>
                        </span>
                        <span className="shrink-0 text-[0.92em] font-semibold tabular-nums text-negative">
                          −{p.value.toFixed(3)}
                        </span>
                      </>
                    }
                  />
                ))}
              </ul>
            </div>
            <div className="snap-end">
              <FinalRow breakdown={breakdown} applied={appliedPenalties} />

              {breakdown.clamped && (
                <p className="mt-1.5 text-[13px] leading-snug text-gray-500">
                  Điểm thô là {breakdown.rawScore.toFixed(3)}, đã cắt về biên của thang [−1, 1].
                </p>
              )}

              {(matchFacts.length > 0 || cautionFacts.length > 0) && (
                <ul className="mt-2.5 space-y-1.5">
                  {matchFacts.map((f, i) => (
                    <li
                      key={`m${i}`}
                      className="flex items-start gap-1.5 text-[13px] leading-snug text-gray-700"
                    >
                      <Check size={13} className="mt-0.5 shrink-0 text-positive" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {cautionFacts.map((c, i) => (
                    <li
                      key={`c${i}`}
                      className={`flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[13px] leading-snug ${CAUTION_CLASS[cautionTone(c)]}`}
                    >
                      <TriangleAlert size={12} className="mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}

              {skippedPenalties.length > 0 && (
                <div className="mt-3 border-t border-dashed border-gray-200 pt-2">
                  <button
                    type="button"
                    onClick={() => setSkippedOpen((v) => !v)}
                    aria-expanded={skippedOpen}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <span className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                      Đã xem xét các yếu tố ({skippedPenalties.length})
                    </span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 text-gray-400 transition-transform ${skippedOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {/* Bung tại chỗ; cột phải cao bằng cột trái nên phần bung thêm nếu tràn thì cột cuộn dọc. */}
                  {skippedOpen && (
                    <ul className="mt-1.5 space-y-1.5">
                      {skippedPenalties.map((p) => (
                        <li key={p.code} className="text-[13px] leading-snug text-gray-500">
                          <span className="font-medium text-gray-600">{p.labelVi}</span>
                          {" - "}
                          {p.reasonVi}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── dòng waterfall + popover "phép tính" ───────────────────────────

type Tone = "positive" | "negative" | "neutral";

function toneKey(contribution: number): Tone {
  if (contribution > 0.0005) return "positive";
  if (contribution < -0.0005) return "negative";
  return "neutral";
}

/**
 * Màu của vệt sáng (`wash`) và của vạch ngăn khi dòng đang sáng (`line`). Xanh cho số hạng cộng, đỏ
 * cho số hạng trừ, xám cho dòng bằng 0 — cùng quy ước ba mức với {@link toneOf}, không phải hai.
 *
 * Lấy từ `--color-positive` / `--color-negative` qua `color-mix` chứ không đặt hex riêng: đó là hai
 * token TÍN HIỆU dùng chung cả màn (dấu +, dấu ✓, chip "cải thiện", nhãn dòng trừ). Hardcode một mã
 * ở đây là lần chỉnh màu sau vệt sáng lạc tông so với mọi thứ quanh nó.
 */
const GLOW: Record<Tone, { color: string; wash: number; line: number }> = {
  positive: { color: "var(--color-positive)", wash: 23, line: 56 },
  negative: { color: "var(--color-negative)", wash: 21, line: 52 },
  neutral: { color: "#78716c", wash: 11, line: 32 },
};

/**
 * Popover phép tính — mở bằng **CLICK**.
 *
 * Trước đây bám hover, nhưng 25/09 hover đã được dùng cho việc bung câu giải thích; để cả hai trên
 * cùng một cử chỉ thì rê chuột ngang qua bảng là popover nhảy loạn. Đổi lại: click thì phải tự lo
 * việc đóng khi bấm ra ngoài — hover trước kia tự đóng lúc rời chuột.
 */
function useCalcPopover(calc: ReactNode) {
  const [open, setOpen] = useState(false);
  const id = useId();
  // `fixed` theo neo (không `absolute`): dòng nằm trong cột cuộn, `absolute` sẽ bị overflow xén.
  const { anchorRef, style } = useAnchoredPopover<HTMLElement>(open, {
    width: 300,
    align: "right",
    onClose: () => setOpen(false),
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // capture: bấm vào phần tử có `stopPropagation` ở trong cũng vẫn đóng được.
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, anchorRef]);

  const toggle = () => setOpen((v) => !v);
  const anchorProps = {
    ref: anchorRef as never,
    tabIndex: 0,
    "aria-expanded": open,
    "aria-describedby": open ? id : undefined,
    title: "Bấm để xem phép tính đầy đủ",
    onClick: toggle,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
  };

  const popover = (
    <AnimatePresence>
      {open && (
        <motion.div
          id={id}
          role="tooltip"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="scroll-fade overflow-y-auto rounded-xl border border-gray-200 p-3 text-[13px] shadow-lg backdrop-blur-[3px]"
          style={{ ...style, background: "rgba(255,255,255,0.97)" }}
        >
          {calc}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { anchorProps, popover, open };
}

/**
 * Một dòng của waterfall — ba mức chi tiết trên ba cử chỉ:
 *
 * 1. **mặc định** — chỉ tên + con số. Câu giải thích ẩn đi; nó chính là phần khiến bảng này bị chê
 *    "quá nhiều chữ" khi ba dòng cùng trải ra một lúc.
 * 2. **hover / focus** — tên và con số co lại một nấc (13px → 12px) để nhường chỗ, câu giải thích
 *    đẩy xuống mở ra. Dùng đúng mẹo `grid-template-rows: 0fr → 1fr` của "Hiện trạng không gian hiện
 *    tại" bên intake: `height: auto` không transition được, còn `max-height` đoán bừa thì hoặc giật
 *    ở cuối hoặc cắt mất chữ khi ghi chú dài.
 * 3. **click** — popover phép tính đầy đủ.
 *
 * Popover đang mở thì `data-open` giữ dòng ở trạng thái đã bung: rời chuột mà dòng co lại trong khi
 * popover vẫn treo ở toạ độ cũ sẽ thành hai mảnh rời nhau.
 */
function BreakdownRow({
  tone,
  last,
  headline,
  detail,
  calc,
}: {
  tone: Tone;
  last: boolean;
  headline: ReactNode;
  detail: string;
  calc: ReactNode;
}) {
  const { anchorProps, popover, open } = useCalcPopover(calc);
  const glow = GLOW[tone];

  return (
    <li
      {...anchorProps}
      data-open={open ? "true" : undefined}
      className="group relative cursor-pointer rounded-lg px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {/* Vạch ngăn vẽ RIÊNG bằng <span>, không dùng `border-t` của <li>: <li> có bo góc nên border
          của nó uốn cong ở hai đầu. Vạch nằm ở ĐÁY dòng — đúng cái khe mà vệt sáng hắt lên — và
          thụt vào 16px mỗi bên, bằng đúng bề ngang vệt sáng, để hai thứ đọc thành một.

          Hai lớp chồng nhau: lớp xám là vạch lúc bình thường, lớp màu mờ dần hiện lên khi sáng.
          Dòng CUỐI không có lớp xám — dưới nó đã là đường kẻ của khối "Mức độ phù hợp", vẽ thêm là
          hai nét sát nhau — nhưng lớp màu thì vẫn có, để lúc hover nó sáng lên y như mọi dòng. */}
      {!last && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-4 right-4 h-px bg-gray-200/80"
        />
      )}
      <span
        aria-hidden
        // Đậm ở TÂM rồi nhạt dần ra hai đầu về trong suốt: ở mép, lớp màu biến mất hẳn nên cái nhìn
        // thấy chính là lớp xám bên dưới — vạch không bị "đổi màu cả cây" mà chỉ sáng lên ở giữa.
        className="pointer-events-none absolute bottom-0 left-4 right-4 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[open=true]:opacity-100"
        style={{ background: seamLine(glow.color, glow.line) }}
      />
      {/* Vệt sáng hắt từ khe dưới ngược lên, cùng hộp (và vì vậy cùng bề ngang) với vạch ngăn. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[open=true]:opacity-100"
        style={{ background: seamWash(glow.color, glow.wash) }}
      />

      <div className="relative">
        <div className="flex items-baseline justify-between gap-2 text-[14px] transition-[font-size] duration-300 group-hover:text-[13px] group-focus-visible:text-[13px] group-data-[open=true]:text-[13px]">
          {headline}
        </div>
        <div className="grid [grid-template-rows:0fr] transition-[grid-template-rows] duration-300 ease-in-out group-hover:[grid-template-rows:1fr] group-focus-visible:[grid-template-rows:1fr] group-data-[open=true]:[grid-template-rows:1fr]">
          <div className="overflow-hidden">
            <p className="pl-[18px] pt-1 text-[13px] leading-snug text-gray-500">{detail}</p>
          </div>
        </div>
      </div>
      {popover}
    </li>
  );
}

/** Dòng tổng: cũng bấm ra phép tính, nhưng không bung/không đèn — nó là kết luận, không phải số hạng. */
function FinalRow({
  breakdown,
  applied,
}: {
  breakdown: ScoreBreakdown;
  applied: ScorePenaltyRow[];
}) {
  const { anchorProps, popover } = useCalcPopover(
    <FinalCalc breakdown={breakdown} applied={applied} />,
  );
  return (
    <div
      {...anchorProps}
      className="-mx-2 cursor-pointer rounded-lg px-2 outline-none transition-colors hover:bg-white focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="mt-3 flex items-baseline justify-between border-t border-gray-200 pt-2.5 text-[14px]">
        <span className="font-semibold text-gray-900">Mức độ phù hợp</span>
        <span className="font-bold tabular-nums text-gray-900">
          {breakdown.score.toFixed(3)}
          <span className="ml-1.5 font-medium text-gray-500">= {breakdown.displayPercent}%</span>
        </span>
      </div>
      {popover}
    </div>
  );
}

/** Tên của vector "cầu" `d` và nhãn trọng số theo mã thành phần — chỉ để đặt tên trong popover. */
function describeComponent(code: string): { direction: string; symbol: string; weight: string } {
  switch (code) {
    case "PERSONAL_NEED_SCORE":
      return { direction: "Dụng thần cần", symbol: "n̂", weight: "1 − Wo" };
    case "PERSONAL_AVOID_SCORE":
      return { direction: "Hành nên tránh", symbol: "tránh", weight: "1 − Wo" };
    case "PERSONAL_SCORE":
      return { direction: "Quan hệ với bản mệnh", symbol: "r", weight: "Wp" };
    case "OCCUPATION_SCORE":
      return { direction: "Nghề cần", symbol: "ô", weight: "Wo" };
    default:
      return { direction: "Phòng thiếu", symbol: "ĝ", weight: "1 − Wp − Wo" };
  }
}

function directionOf(code: string, breakdown: ScoreBreakdown): ProductElementRow[] | null {
  switch (code) {
    case "PERSONAL_SCORE":
      return breakdown.vectors.ruleScore;
    case "OCCUPATION_SCORE":
      return breakdown.vectors.occupationDirection;
    default:
      return breakdown.vectors.normalizedGap;
  }
}

/**
 * `value = Σ_e d[e]·p[e]` liệt kê từng hành; rồi `× weight = contribution`. Hành có `d = 0` và `p = 0`
 * bỏ qua; sắp theo |đóng góp| giảm dần để dòng "vì sao được điểm" đứng đầu.
 */
function ComponentCalc({
  component,
  breakdown,
  product,
}: {
  component: ScoreComponentRow;
  breakdown: ScoreBreakdown;
  product: Record<string, number>;
}) {
  const meta = describeComponent(component.code);
  const direction = toMap(directionOf(component.code, breakdown));

  // v3.6 — nhánh Carry không còn là tích trong: "phủ" = min(cần, cấp) theo hành; "kỵ" = −p theo hành kỵ.
  const mode: "cover" | "avoid" | "dot" =
    component.code === "PERSONAL_NEED_SCORE"
      ? "cover"
      : component.code === "PERSONAL_AVOID_SCORE"
        ? "avoid"
        : "dot";
  const avoid = new Set(breakdown.personalAvoidElements ?? []);
  const rows = ELEMENT_ORDER.map((e) => ({ element: e, d: direction[e] ?? 0, p: product[e] ?? 0 }))
    .filter((r) =>
      mode === "avoid" ? avoid.has(r.element) : Math.abs(r.d) >= 0.005 || r.p >= 0.005,
    )
    .map((r) => ({
      ...r,
      term: mode === "cover" ? Math.min(r.d, r.p) : mode === "avoid" ? -r.p : r.d * r.p,
    }))
    // Dòng "× 0" không nói gì (vật không mang hành đó) — ẩn để tiết kiệm chỗ; riêng "đáp ứng" giữ hành bạn
    // đang cần mà vật chưa có, vì đó chính là lý do chưa đạt 100 %.
    .filter((r) => Math.abs(r.term) >= 0.0005 || (mode === "cover" && r.d >= 0.005))
    .sort((a, b) => Math.abs(b.term) - Math.abs(a.term));
  const sum = rows.reduce((s, r) => s + r.term, 0);
  const clamped = Math.max(-1, Math.min(1, sum));
  const mismatch = Math.abs(clamped - component.value) > 0.002;
  const title =
    mode === "cover"
      ? `${component.labelVi} - phần nhu cầu được đáp ứng`
      : mode === "avoid"
        ? `${component.labelVi} - phần vật mang hành nên tránh`
        : `${component.labelVi} = ${meta.symbol}·p`;
  const header =
    mode === "cover"
      ? "đáp ứng = phần nhỏ hơn giữa bạn cần và vật mang"
      : mode === "avoid"
        ? "vật mang bao nhiêu hành nên tránh"
        : `${meta.direction} (${meta.symbol}) × vật mang (p)`;

  return (
    <div>
      <p className="mb-1.5 font-semibold text-slate-900">{title}</p>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 text-slate-700">
        <span className="text-[12px] uppercase tracking-wide text-slate-400">Hành</span>
        <span className="text-[12px] uppercase tracking-wide text-slate-400">{header}</span>
        <span className="text-right text-[12px] uppercase tracking-wide text-slate-400">= </span>
        {rows.map((r) => (
          <CalcRow
            key={r.element}
            element={r.element}
            left={mode === "avoid" ? "" : fmt(r.d, 2)}
            right={mode === "cover" ? `min(${fmt(r.d, 2)}, ${fmt(r.p, 3)})` : fmt(r.p, 3)}
            result={r.term}
            op={mode === "cover" ? "" : "×"}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-black/10 pt-1.5 font-semibold text-slate-900">
        <span>Tổng{Math.abs(sum) > 1 ? " (giới hạn ±1)" : ""}</span>
        <span className="tabular-nums">{signed(component.value)}</span>
      </div>
      <div className="flex items-center justify-between text-slate-600">
        <span>
          × trọng số {meta.weight} = {component.weight.toFixed(2)}
        </span>
        <span className="font-semibold tabular-nums text-slate-900">
          {signed(component.contribution)}
        </span>
      </div>
      {mismatch && (
        <p className="mt-1 text-[12px] text-amber-700">
          FE cộng ra {fmt(clamped, 3)} khác BE {fmt(component.value, 3)} - đang đọc sai vector, số
          BE là số đúng.
        </p>
      )}
    </div>
  );
}

/**
 * Penalty: `mức gốc × hệ số = trừ`. Với "khắc bản mệnh (phần phụ)" hệ số là Σ tỉ trọng các hành khắc
 * mệnh của sản phẩm — liệt kê luôn các hành đó để user thấy 0.25 lấy từ đâu.
 */
function PenaltyCalc({
  penalty,
  breakdown,
  product,
}: {
  penalty: ScorePenaltyRow;
  breakdown: ScoreBreakdown;
  product: Record<string, number>;
}) {
  const destiny = breakdown.destinyElement;
  const clashRows =
    penalty.code === "MINOR_CLASH_PENALTY" && destiny
      ? ELEMENT_ORDER.filter((e) => CONTROLS[e] === destiny && (product[e] ?? 0) >= 0.005).map(
          (e) => ({
            element: e,
            p: product[e] ?? 0,
          }),
        )
      : [];

  return (
    <div>
      <p className="mb-1.5 font-semibold text-slate-900">{penalty.labelVi}</p>
      {clashRows.length > 0 && (
        <div className="mb-1.5 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 text-slate-700">
          <span className="col-span-3 text-[12px] uppercase tracking-wide text-slate-400">
            Hành khắc bản mệnh {destiny ? elementVi(destiny) : ""} trong sản phẩm
          </span>
          {clashRows.map((r) => (
            <CalcRow
              key={r.element}
              element={r.element}
              left=""
              right={`${Math.round(r.p * 100)}%`}
              result={null}
            />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-slate-600">
        <span>
          Mức cân nhắc {penalty.paramValue.toFixed(2)}
          {penalty.factor != null &&
            ` × ${penalty.factorLabelVi ?? "hệ số"} ${penalty.factor.toFixed(2)}`}
        </span>
        <span className="font-semibold tabular-nums text-negative">−{penalty.value.toFixed(3)}</span>
      </div>
    </div>
  );
}

/** Điểm cuối = Σ cộng − Σ trừ, cắt về [−1, 1], rồi `%` = (điểm + 1) / 2 — 50 % là trung tính. */
function FinalCalc({
  breakdown,
  applied,
}: {
  breakdown: ScoreBreakdown;
  applied: ScorePenaltyRow[];
}) {
  const plus = breakdown.components.map((c) => signed(c.contribution)).join(" ");
  const minus = applied.map((p) => `− ${p.value.toFixed(3)}`).join(" ");
  return (
    <div className="space-y-1 text-slate-700">
      <p className="font-semibold text-slate-900">Mức độ phù hợp</p>
      <div className="flex justify-between">
        <span>
          {plus}
          {minus ? ` ${minus}` : ""}
        </span>
        <span className="tabular-nums">= {fmt(breakdown.rawScore, 3)}</span>
      </div>
      {breakdown.clamped && (
        <div className="flex justify-between">
          <span>Cắt về thang [−1, 1]</span>
          <span className="tabular-nums">= {fmt(breakdown.score, 3)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-black/10 pt-1 font-semibold text-slate-900">
        <span>({fmt(breakdown.score, 3)} + 1) ÷ 2 × 100</span>
        <span className="tabular-nums">= {breakdown.displayPercent}%</span>
      </div>
      <p className="text-[12px] text-slate-500">
        50% = trung tính · ≥ 60% "Phù hợp" · ≥ 80% "Rất hợp" · &lt; 40% "Cân nhắc".
      </p>
    </div>
  );
}

function CalcRow({
  element,
  left,
  right,
  result,
  op = "×",
}: {
  element: string;
  left: string;
  right: string;
  result: number | null;
  op?: string;
}) {
  return (
    <>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: elementColor(element) }}
        />
        {elementVi(element)}
      </span>
      <span className="tabular-nums text-slate-600">{left ? `${left} ${op} ${right}` : right}</span>
      <span
        className={`text-right tabular-nums ${result && Math.abs(result) >= 0.0005 ? "font-medium text-slate-800" : "text-slate-400"}`}
      >
        {result == null ? "" : signed(result)}
      </span>
    </>
  );
}

function fmt(value: number, digits: number): string {
  return value.toFixed(digits);
}

function signed(value: number): string {
  if (Math.abs(value) < 0.0005) return "0.000"; // làm tròn về 0 thì không mang dấu nào
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(3)}`;
}

/**
 * Màu + biểu tượng theo DẤU của số hạng. Ba mức, không phải hai: một dòng bằng 0 (vd "Không mang hành bạn
 * nên tránh") không cộng cũng không trừ — vẽ dấu + xanh cho nó là khen nhầm. Ngưỡng 0.0005 khớp chỗ hiển
 * thị 3 chữ số.
 */
function toneOf(contribution: number): { icon: ReactNode; text: string; value: string } {
  if (contribution > 0.0005)
    return {
      icon: <Plus size={13} className="shrink-0 text-positive" />,
      text: "text-gray-800",
      value: "text-gray-900",
    };
  if (contribution < -0.0005)
    return {
      icon: <Minus size={12} className="shrink-0" />,
      text: "text-negative",
      value: "text-negative",
    };
  return {
    icon: <Dot size={12} className="shrink-0 text-gray-400" />,
    text: "text-gray-500",
    value: "text-gray-500",
  };
}
