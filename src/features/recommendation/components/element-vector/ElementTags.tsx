import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ElementAnalysisRow } from "@/features/users/types/workspace";
import {
  ATTENTION_BG,
  ATTENTION_TEXT,
  TAG_GAP_THRESHOLD,
  elementColor,
  elementVi,
  gapStatus,
  type GapStatus,
} from "./constants";

const STATUS_TEXT: Record<GapStatus, string> = {
  deficit: "↓ thiếu",
  surplus: "↑ thừa",
  balanced: "ổn",
};

interface ElementTagsProps {
  rows: ElementAnalysisRow[];
  /**
   * Đang xem trước một sản phẩm: chip hiện thêm mũi tên ±điểm % (previewCurrent − current) để user
   * thấy ngay món đó kéo hành nào lên/xuống bao nhiêu, không phải nhìn radar đoán.
   */
  showPreviewDelta?: boolean;
  /**
   * Trạng thái ĐÃ CHỐT (chỉ các món đã bấm chọn, không tính món đang hover). Mỗi lần nó đổi, badge của
   * hành nào đổi sẽ tạm hiện đúng bước vừa đổi (▲ +1.2 / ▼ −0.8). Không truyền = không có hiệu ứng.
   * Tách khỏi `rows` để hover chỉ cập nhật số mà không nhảy hiệu ứng — chỉ bấm mới nhảy.
   */
  pulseRows?: ElementAnalysisRow[];
}

/** Điểm % nhỏ hơn mức này coi như "không đổi" — không vẽ mũi tên cho nhiễu làm tròn. */
const DELTA_MIN_POINTS = 0.5;

/** Bước đổi (điểm %) nhỏ hơn mức này thì không hiện — tránh badge nhảy vì sai số làm tròn. */
const STEP_MIN_POINTS = 0.3;

/** Badge hiện bước vừa đổi trong bao lâu rồi mới trở về tổng thay đổi. */
const PULSE_MS = 1500;

/** Lần đổi gần nhất của một hành. */
interface Pulse {
  /** Chữ ký giá trị lúc đổi — duy nhất cho mỗi lần đổi, dùng làm key cho hiệu ứng. */
  id: string;
  /** Điểm % so với lần chốt trước (+ tăng, − giảm). */
  step: number;
  /** Bước này kéo hành về GẦN mức lý tưởng hơn. */
  improves: boolean;
}

/**
 * Theo dõi mỗi lần trạng thái đã chốt đổi và ghi lại hành nào tăng/giảm bao nhiêu so với lần trước. So
 * sánh ngay trong render (mẫu "điều chỉnh state khi prop đổi" của React) thay vì effect, để hiệu ứng chạy
 * cùng khung hình với số mới; tự xoá sau PULSE_MS.
 */
function useElementPulses(rows: ElementAnalysisRow[] | undefined) {
  const values = Object.fromEntries(
    (rows ?? []).map((r) => [r.element, r.previewCurrent ?? r.current]),
  );
  const signature = (rows ?? [])
    .map((r) => `${r.element}:${values[r.element].toFixed(4)}`)
    .join("|");

  const [last, setLast] = useState({ signature, values });
  const [pulses, setPulses] = useState<Record<string, Pulse>>({});

  if (signature !== last.signature) {
    const next: Record<string, Pulse> = {};
    for (const row of rows ?? []) {
      const before = last.values[row.element];
      const after = values[row.element];
      if (before === undefined) continue;
      const step = (after - before) * 100;
      if (Math.abs(step) < STEP_MIN_POINTS) continue;
      next[row.element] = {
        id: `${row.element}@${signature}`,
        step,
        improves: Math.abs(after - row.adjustedIdeal) < Math.abs(before - row.adjustedIdeal),
      };
    }
    setLast({ signature, values });
    if (Object.keys(next).length) setPulses(next);
  }

  useEffect(() => {
    if (Object.keys(pulses).length === 0) return;
    const timer = window.setTimeout(() => setPulses({}), PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [pulses]);

  return pulses;
}

const TONE_GOOD = "bg-[#e6f2dc] text-positive-dark";
const TONE_BAD = "bg-orange-100 text-orange-700";

/** Dải chip 5 hành: dot màu + tên + trạng thái (cần bù/thừa/ổn) suy từ gap của từng hành. */
export default function ElementTags({
  rows,
  showPreviewDelta = false,
  pulseRows,
}: ElementTagsProps) {
  const reduceMotion = useReducedMotion();
  const pulses = useElementPulses(pulseRows);

  return (
    // gap-y rộng hơn gap-x: chừa chỗ cho badge ±điểm nổi ở mép trên chip hàng dưới.
    <div className="flex flex-wrap gap-x-2 gap-y-3 pt-1">
      {rows.map((row) => {
        const status = gapStatus(row.gap, TAG_GAP_THRESHOLD);
        const attention = status !== "balanced";
        // Đơn vị điểm % của vector Σ=1 (0.03 → 3 điểm) — cùng thang với "Hiện tại" trong tooltip radar.
        const deltaPoints = showPreviewDelta
          ? ((row.previewCurrent ?? row.current) - row.current) * 100
          : 0;
        const showDelta = showPreviewDelta && Math.abs(deltaPoints) >= DELTA_MIN_POINTS;
        // Xanh = kéo hành này về GẦN mức lý tưởng hơn, cam = đẩy xa ra. Tăng không đồng nghĩa tốt: hành
        // đang thừa mà còn tăng nữa là tệ đi.
        const improves =
          Math.abs((row.previewCurrent ?? row.current) - row.adjustedIdeal) <
          Math.abs(row.current - row.adjustedIdeal);

        // Vừa bấm thêm/bớt → badge tạm hiện BƯỚC vừa đổi, hết PULSE_MS thì về tổng thay đổi.
        const pulse = pulses[row.element];
        const badge = pulse
          ? {
              key: pulse.id,
              text: `${pulse.step > 0 ? "▲ +" : "▼ −"}${Math.abs(pulse.step).toFixed(1)}`,
              tone: pulse.improves ? TONE_GOOD : TONE_BAD,
              rising: pulse.step > 0,
              title: `Vừa ${pulse.step > 0 ? "tăng" : "giảm"} ${Math.abs(pulse.step).toFixed(1)} điểm`,
            }
          : showDelta
            ? {
                key: `total-${deltaPoints.toFixed(1)}`,
                text: `${deltaPoints > 0 ? "▲" : "▼"} ${Math.abs(deltaPoints).toFixed(1)}`,
                tone: improves ? TONE_GOOD : TONE_BAD,
                rising: deltaPoints > 0,
                title: `Nếu đặt sản phẩm đang xem vào phòng: ${improves ? "gần" : "xa"} mức lý tưởng hơn`,
              }
            : null;

        return (
          <span
            key={row.element}
            className="relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
            style={
              attention
                ? {
                    backgroundColor: ATTENTION_BG,
                    color: ATTENTION_TEXT,
                    borderColor: "transparent",
                  }
                : {
                    backgroundColor: "var(--fd-surface)",
                    color: "var(--color-gray-500)",
                    borderColor: "var(--color-gray-200)",
                  }
            }
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: elementColor(row.element) }}
            />
            <span className="font-semibold text-[#111827]">{elementVi(row.element)}</span>
            <span className="font-medium">{STATUS_TEXT[status]}</span>
            {/* Badge nổi (absolute) — nằm trong luồng thì chip rộng ra, dải chip xuống dòng, cả khối
                dịch và chuột rời khỏi dòng đang hover → hover tắt/bật liên tục. Số mới trượt vào theo
                hướng đổi (tăng: từ dưới lên, giảm: từ trên xuống); hover chỉ đổi chữ, không trượt. */}
            {badge && (
              <span
                className={`pointer-events-none absolute -top-2.5 -right-1.5 overflow-hidden whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums shadow-sm ring-1 ring-white transition-colors duration-300 ${badge.tone}`}
                title={badge.title}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={badge.key}
                    className="block"
                    initial={
                      reduceMotion || !pulse ? false : { y: badge.rising ? 10 : -10, opacity: 0 }
                    }
                    animate={{ y: 0, opacity: 1 }}
                    exit={
                      reduceMotion || !pulse
                        ? { opacity: 0, transition: { duration: 0 } }
                        : { y: badge.rising ? -10 : 10, opacity: 0 }
                    }
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    {badge.text}
                  </motion.span>
                </AnimatePresence>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
