import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home } from "lucide-react";
import type { ElementAnalysisRow, ScoreBreakdown } from "../../types/recommendation";
import { ELEMENT_ORDER, GAP_THRESHOLD, elementColor, elementVi } from "./constants";
import { personalAxisOffReason } from "../../lib/breakdown";
import { useAnchoredPopover } from "./useAnchoredPopover";

interface RoomNeedCardProps {
  /** Tên phòng đang xét — tiêu đề thẻ. */
  workspaceName: string;
  /** `gap` của BE: `ideal − current` từng hành (dương = phòng thiếu, âm = phòng thừa). */
  gap: ElementAnalysisRow[];
  breakdown: ScoreBreakdown | null;
  /** Số nguồn user đã khai cho phòng; 0 ⇒ hiện trạng đang suy từ loại phòng. */
  evidenceCount: number;
}

/**
 * Thẻ "Phòng đang cần" — cặp song sinh của `NeedCard` bên luồng bản mệnh: cùng dữ liệu với radar bên
 * trái, đặt ngay trên waterfall để user thấy **phòng thiếu gì / thừa gì** trước khi đọc dòng
 * "Khớp nhu cầu của phòng". Thay cho thanh ngũ hành + slider trọng số trước đây: slider là một công cụ
 * mô phỏng chứ không phải thông tin, còn 5 thanh chỉ lặp lại đúng thứ radar đã vẽ.
 *
 * Trọng số (phòng / bản mệnh / nghề) hiện thành một dòng tĩnh; hover ra nguồn gốc của từng con số.
 */
export default function RoomNeedCard({
  workspaceName,
  gap,
  breakdown,
  evidenceCount,
}: RoomNeedCardProps) {
  const [open, setOpen] = useState(false);
  // Thẻ nằm trong cột cuộn của hộp điểm ⇒ popover phải `fixed`, `absolute` sẽ bị overflow xén.
  const { anchorRef, style } = useAnchoredPopover<HTMLDivElement>(open, {
    width: 300,
    align: "left",
    onClose: () => setOpen(false),
  });

  const byElement = new Map(gap.map((r) => [r.element, r]));
  const ranked = ELEMENT_ORDER.map((e) => ({
    element: e,
    gap: byElement.get(e)?.gap ?? 0,
    ideal: byElement.get(e)?.adjustedIdeal ?? 0,
    current: byElement.get(e)?.current ?? 0,
  })).sort((a, b) => b.gap - a.gap);
  const lacking = ranked.filter((r) => r.gap > GAP_THRESHOLD);
  const surplus = ranked.filter((r) => r.gap < -GAP_THRESHOLD).sort((a, b) => a.gap - b.gap);

  const wp = breakdown?.personalWeight?.value ?? 0;
  const wo = breakdown?.occupation?.weight ?? 0;
  const roomShare = Math.max(0, 1 - wp - wo);
  const offReason = personalAxisOffReason(breakdown);

  return (
    <div
      ref={anchorRef}
      className="rounded-xl border border-primary/30 bg-primary/[0.06] px-3 py-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <div className="flex items-center gap-1.5 font-semibold text-[#4a6a2c]">
        <Home size={13} />
        <span className="truncate">Phòng đang cần</span>
        <span className="ml-auto shrink-0 text-[11px] font-medium text-[#5f7d3c]">
          {evidenceCount === 0 ? "suy từ loại phòng" : `${evidenceCount} nguồn`}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {lacking.length === 0 && surplus.length === 0 && (
          <span className="text-xs text-gray-600">
            Phòng đang cân bằng - không hành nào thiếu hay thừa rõ rệt.
          </span>
        )}
        {lacking.map((r) => (
          <span
            key={r.element}
            className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: elementColor(r.element) }}
            />
            {elementVi(r.element)} +{Math.round(r.gap * 100)}%
          </span>
        ))}
        {surplus.length > 0 && (
          <>
            <span className="ml-1 text-[11px] uppercase tracking-wide text-gray-400">
              đang thừa
            </span>
            {surplus.map((r) => (
              <span
                key={r.element}
                className="rounded-full border border-[#b94a47]/40 bg-[#fdecea] px-2 py-0.5 text-xs font-medium text-[#b3261e]"
              >
                {elementVi(r.element)}
              </span>
            ))}
          </>
        )}
      </div>

      {/* Trọng số tĩnh thay cho slider: đây là cách hệ thống đang cân, không phải thứ để user chỉnh ở trang sản phẩm. */}
      <p className="mt-1.5 text-xs leading-snug text-gray-600">
        {offReason ? (
          offReasonText(offReason)
        ) : (
          <>
            Cân theo <b>{Math.round(roomShare * 100)}% phòng</b>
            {wp > 0 && (
              <>
                {" "}
                · <b>{Math.round(wp * 100)}% bản mệnh</b>
              </>
            )}
            {wo > 0 && (
              <>
                {" "}
                · <b>{Math.round(wo * 100)}% nghề</b>
              </>
            )}
          </>
        )}
      </p>

      <AnimatePresence>
        {open && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="scroll-fade overflow-y-auto rounded-xl border border-primary/50 p-3 text-xs text-slate-700 shadow-lg backdrop-blur-[3px]"
            style={{ ...style, background: "rgba(255,255,255,0.97)" }}
          >
            <p className="mb-1.5 font-semibold text-slate-900">Các con số này từ đâu?</p>
            <p className="leading-snug">
              <b>Mức lý tưởng</b> lấy theo loại phòng và mục đích sử dụng; <b>hiện tại</b> gộp từ
              nền phòng, màu sắc/vật liệu bạn khai, đồ đã đặt và bản mệnh chủ phòng. Phòng{" "}
              <b>cần</b> = lý tưởng − hiện tại.
            </p>
            <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1">
              <span className="col-span-3 text-[11px] uppercase tracking-wide text-slate-400">
                Lý tưởng → hiện tại ({workspaceName})
              </span>
              {ranked.map((r) => (
                <span key={r.element} className="contents">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: elementColor(r.element) }}
                    />
                    {elementVi(r.element)}
                  </span>
                  <span className="tabular-nums text-slate-500">
                    {Math.round(r.ideal * 100)}% → {Math.round(r.current * 100)}%
                  </span>
                  <span
                    className={`text-right font-medium tabular-nums ${
                      r.gap > GAP_THRESHOLD
                        ? "text-[#4a6a2c]"
                        : r.gap < -GAP_THRESHOLD
                          ? "text-[#b3261e]"
                          : "text-slate-400"
                    }`}
                  >
                    {r.gap > GAP_THRESHOLD ? "thiếu" : r.gap < -GAP_THRESHOLD ? "thừa" : "ổn"}{" "}
                    {Math.abs(Math.round(r.gap * 100))}%
                  </span>
                </span>
              ))}
            </div>
            {breakdown?.personalWeight && !offReason && (
              <p className="mt-2 leading-snug">
                <b>Trọng số bản mệnh {Math.round(wp * 100)}%</b>:{" "}
                {breakdown.personalWeight.reasonVi}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Ba trạng thái rỗng của trục cá nhân (§10.7) — mỗi cái dẫn tới một hành động khác nhau. */
function offReasonText(reason: NonNullable<ReturnType<typeof personalAxisOffReason>>) {
  switch (reason) {
    case "public-space":
      return (
        <>
          <b>Không gian chung</b> - điểm chỉ tính theo nhu cầu của phòng, không neo vào bản mệnh của
          riêng ai.
        </>
      );
    case "no-birthdate":
      return (
        <>
          Chưa có ngày sinh trong hồ sơ - điểm chỉ dựa trên nhu cầu của phòng.{" "}
          <a href="/profile" className="underline underline-offset-2">
            Thêm ngày sinh
          </a>{" "}
          để nhận gợi ý hợp bản mệnh.
        </>
      );
    default:
      return <>Trục bản mệnh đang tắt trong cấu hình - điểm chỉ dựa trên nhu cầu của phòng.</>;
  }
}
