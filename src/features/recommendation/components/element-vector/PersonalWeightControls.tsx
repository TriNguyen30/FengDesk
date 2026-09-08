import { useState } from "react";
import { Info, RotateCcw, UserRound } from "lucide-react";
import type { ScoreBreakdown } from "../../types/recommendation";
import {
  personalAxisOffReason,
  scoreToPercent,
  simulateScore,
} from "../../lib/breakdown";

interface PersonalWeightControlsProps {
  breakdown: ScoreBreakdown;
  /** Mức `Wp` đang mô phỏng (null = dùng đúng giá trị BE trả). */
  simulatedWp: number | null;
  onSimulate: (wp: number | null) => void;
}

/**
 * Chip "trọng số cá nhân" + slider mô phỏng `Wp`.
 *
 * **Slider không gọi API.** BE trả cả `ĝ` lẫn `r`, nên `d` và `priorityVector` dựng lại được ngay tại
 * client ở bất kỳ mức `Wp` nào (§10.3) — kéo tới đâu radar morph tới đó, tức thì.
 *
 * Nó trả lời một câu hỏi mà con số tĩnh không trả lời được: *"nếu tôi coi trọng bản mệnh hơn/kém thì
 * gợi ý đổi thế nào"* — và cho thấy trọng số đang là một lựa chọn có lý do, không phải hằng số bí ẩn.
 */
export default function PersonalWeightControls({
  breakdown,
  simulatedWp,
  onSimulate,
}: PersonalWeightControlsProps) {
  const [showReason, setShowReason] = useState(false);

  const pw = breakdown.personalWeight;
  const offReason = personalAxisOffReason(breakdown);

  // Trục cá nhân tắt: không có gì để kéo. Ba lý do khác nhau ⇒ ba lời nhắn khác nhau, vì hành động
  // user cần làm khác hẳn nhau (§10.7).
  if (!pw || offReason) {
    return <PersonalAxisOffNotice reason={offReason} />;
  }

  const activeWp = simulatedWp ?? pw.value;
  const isSimulating = simulatedWp !== null && Math.abs(simulatedWp - pw.value) > 0.001;
  const simulatedScore = simulateScore(breakdown, activeWp);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowReason((v) => !v)}
          aria-expanded={showReason}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#D9AD41]/15 px-2.5 py-1 text-xs font-medium text-[#8a6d1f]"
        >
          <UserRound size={13} />
          Trọng số bản mệnh {Math.round(pw.value * 100)}%
          <Info size={12} className="opacity-70" />
        </button>

        {isSimulating && (
          <button
            type="button"
            onClick={() => onSimulate(null)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-700"
          >
            <RotateCcw size={12} />
            Về mức thật ({Math.round(pw.value * 100)}%)
          </button>
        )}
      </div>

      {showReason && (
        <p className="mt-2 text-[11px] leading-snug text-gray-600">{pw.reasonVi}</p>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <label htmlFor="wp-slider">Thử mức khác</label>
          <span className="tabular-nums">
            {Math.round(activeWp * 100)}% bản mệnh ·{" "}
            <span className={isSimulating ? "font-semibold text-[#8a6d1f]" : "text-gray-500"}>
              {scoreToPercent(simulatedScore)}%
            </span>
          </span>
        </div>
        <input
          id="wp-slider"
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(activeWp * 100)}
          onChange={(e) => onSimulate(Number(e.target.value) / 100)}
          className="mt-1 w-full accent-[#D9AD41]"
        />
        <p className="mt-1 text-[10px] leading-snug text-gray-400">
          Chỉ để xem thử — không đổi cấu hình hệ thống, và điểm thật vẫn là {breakdown.displayPercent}%.
        </p>
      </div>
    </div>
  );
}

/** Ba trạng thái rỗng của trục cá nhân (§10.7) — mỗi cái dẫn tới một hành động khác nhau. */
function PersonalAxisOffNotice({ reason }: { reason: ReturnType<typeof personalAxisOffReason> }) {
  if (reason === "public-space") {
    return (
      <p className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] leading-snug text-gray-600">
        <span className="font-medium">Không gian chung</span> — điểm không neo vào bản mệnh của riêng
        ai, chỉ tính theo nhu cầu của phòng.
      </p>
    );
  }

  if (reason === "no-birthdate") {
    return (
      <div className="rounded-xl bg-[#D9AD41]/10 px-3 py-2 text-[11px] leading-snug text-[#8a6d1f]">
        <p className="font-medium">Chưa có ngày sinh trong hồ sơ</p>
        <p className="mt-0.5">
          Điểm hiện chỉ dựa trên nhu cầu của phòng.{" "}
          <a href="/profile" className="underline underline-offset-2">
            Thêm ngày sinh
          </a>{" "}
          để nhận gợi ý hợp bản mệnh.
        </p>
      </div>
    );
  }

  if (reason === "disabled") {
    return (
      <p className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] leading-snug text-gray-600">
        Trục cá nhân đang tắt trong cấu hình — điểm chỉ dựa trên nhu cầu của phòng.
      </p>
    );
  }

  return null;
}
