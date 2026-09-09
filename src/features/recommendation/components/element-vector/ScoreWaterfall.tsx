import { useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import type { ScoreBreakdown } from "../../types/recommendation";

interface ScoreWaterfallProps {
  breakdown: ScoreBreakdown;
}

/**
 * Waterfall dưới `ScoreBadge` — R1: **thành phần nào tạo ra con số hiển thị**.
 *
 * Đọc từ trên xuống là đúng thứ tự engine tính: từng thành phần cộng vào, rồi từng penalty trừ ra,
 * ra đúng con số trên badge. Số ở đây là số của BE, FE không tính lại — nếu tự tính, hai bên sẽ lệch
 * cách làm tròn và user thấy waterfall không cộng ra điểm.
 *
 * Accordion liệt kê **mọi** penalty kể cả loại không bị áp: "đã xét và không trừ" khác hẳn "không tồn
 * tại", và người dùng cần thấy hệ thống không giấu luật nào.
 */
export default function ScoreWaterfall({ breakdown }: ScoreWaterfallProps) {
  const [open, setOpen] = useState(false);

  const appliedPenalties = breakdown.penalties.filter((p) => p.applied);
  const skippedPenalties = breakdown.penalties.filter((p) => !p.applied);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-xs font-semibold text-gray-700">Điểm này đến từ đâu?</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-gray-200 px-3 py-3">
          <ul className="space-y-2.5">
            {breakdown.components.map((c) => (
              <li key={c.code}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-gray-800">
                    <Plus size={12} className="shrink-0 text-emerald-600" />
                    <span className="truncate">{c.labelVi}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-gray-600">
                    {c.value.toFixed(3)}
                    <span className="text-gray-400"> × {c.weight.toFixed(2)} = </span>
                    <span className="font-semibold text-gray-900">
                      {signed(c.contribution)}
                    </span>
                  </span>
                </div>
                <p className="mt-0.5 pl-[18px] text-[11px] leading-snug text-gray-500">
                  {c.reasonVi}
                </p>
              </li>
            ))}

            {appliedPenalties.map((p) => (
              <li key={p.code}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-red-700">
                    <Minus size={12} className="shrink-0" />
                    <span className="truncate">{p.labelVi}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-red-700">
                    −{p.value.toFixed(3)}
                  </span>
                </div>
                <p className="mt-0.5 pl-[18px] text-[11px] leading-snug text-gray-500">
                  {p.reasonVi}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-baseline justify-between border-t border-gray-200 pt-2.5 text-xs">
            <span className="font-semibold text-gray-900">Điểm cuối</span>
            <span className="font-bold tabular-nums text-gray-900">
              {breakdown.score.toFixed(3)}
              <span className="ml-1.5 font-medium text-gray-500">
                = {breakdown.displayPercent}%
              </span>
            </span>
          </div>

          {breakdown.clamped && (
            <p className="mt-1.5 text-[11px] leading-snug text-gray-500">
              Điểm thô là {breakdown.rawScore.toFixed(3)}, đã cắt về biên của thang [−1, 1].
            </p>
          )}

          {skippedPenalties.length > 0 && (
            <div className="mt-3 border-t border-dashed border-gray-200 pt-2.5">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Đã xét, không trừ điểm
              </p>
              <ul className="space-y-1.5">
                {skippedPenalties.map((p) => (
                  <li key={p.code} className="text-[11px] leading-snug text-gray-500">
                    <span className="font-medium text-gray-600">{p.labelVi}</span>
                    {" — "}
                    {p.reasonVi}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-[10px] text-gray-400">
            Công thức phiên bản {breakdown.formulaVersion}. Điểm của hai phiên bản công thức không so
            sánh trực tiếp được với nhau.
          </p>
        </div>
      )}
    </div>
  );
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(3)}`;
}
