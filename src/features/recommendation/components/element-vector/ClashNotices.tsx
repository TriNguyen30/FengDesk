import { AlertTriangle, Sparkles } from "lucide-react";
import type { ConflictResolution, ScoreBreakdown } from "../../types/recommendation";
import { elementVi } from "./constants";
import { hasDestinyClash } from "../../lib/breakdown";

/**
 * Badge "Khắc bản mệnh" — hiện **độc lập với %**.
 *
 * Lý do tách khỏi con số: "bị khắc" là một **phạm trù kiêng kỵ**, còn phần trăm là một đại lượng
 * **liên tục**. Một sản phẩm khắc mệnh nhưng phòng đang rất cần hành đó vẫn có thể ra 61% — nhìn số
 * thì tưởng "khá hợp", trong khi nghiệp vụ nói là nên tránh. % không tải được tính phạm trù, nên phải
 * có một dấu hiệu riêng (§14.6 #7).
 *
 * Chỉ bật cho `BiKhac`, không bật cho `TietKhi`: hao khí là mất mát nhẹ và đã nằm trong điểm hợp mệnh.
 */
export function ClashBadge({ breakdown }: { breakdown: ScoreBreakdown | null }) {
  if (!hasDestinyClash(breakdown)) return null;

  const destiny = breakdown?.destinyElement;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-[#fdecea] px-2.5 py-1 text-xs font-semibold text-[#b3261e]"
      title={
        breakdown?.penalties.find((p) => p.code === "USER_CONFLICT_PENALTY")?.reasonVi ?? undefined
      }
    >
      <AlertTriangle size={13} className="shrink-0" />
      Khắc bản mệnh{destiny ? ` ${elementVi(destiny)}` : ""}
    </span>
  );
}

/**
 * Banner hoá giải — §13. Xuất hiện khi phòng đang thiếu **đúng** hành khắc bản mệnh user.
 *
 * Đây không phải cảnh báo lỗi: engine **đã tự giải** bằng cách để hai lực triệt tiêu nhau ở hành xung
 * và đẩy hành trung gian lên. Việc của màn hình chỉ là NÓI RA, để user không tưởng hệ thống bỏ sót
 * nhu cầu của phòng khi thấy vật hành đó bị xếp thấp.
 *
 * Quy luật ngũ hành bảo đảm hành hoá giải luôn tồn tại và luôn duy nhất: A khắc B thì con của A = mẹ của B.
 */
export function ConflictResolutionBanner({ conflict }: { conflict: ConflictResolution | null }) {
  if (!conflict) return null;

  return (
    <div className="flex gap-2.5 rounded-xl border border-[#D9AD41]/40 bg-[#D9AD41]/10 px-3 py-2.5">
      <Sparkles size={15} className="mt-0.5 shrink-0 text-[#8a6d1f]" />
      <div className="min-w-0 text-xs leading-relaxed text-[#6b5416]">
        <p className="font-semibold">
          Ưu tiên hành {elementVi(conflict.bridge)} để hoá giải
        </p>
        <p className="mt-0.5">{conflict.reasonVi}</p>
      </div>
    </div>
  );
}
