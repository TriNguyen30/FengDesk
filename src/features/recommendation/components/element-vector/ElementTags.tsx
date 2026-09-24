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
}

/** Điểm % nhỏ hơn mức này coi như "không đổi" — không vẽ mũi tên cho nhiễu làm tròn. */
const DELTA_MIN_POINTS = 0.5;

/** Dải chip 5 hành: dot màu + tên + trạng thái (cần bù/thừa/ổn) suy từ gap của từng hành. */
export default function ElementTags({ rows, showPreviewDelta = false }: ElementTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
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
        return (
          <span
            key={row.element}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
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
            {showDelta && (
              <span
                className={`ml-0.5 rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${
                  improves ? "bg-positive/15 text-positive-dark" : "bg-orange-100 text-orange-700"
                }`}
                title={`Nếu đặt sản phẩm đang xem vào phòng: ${improves ? "gần" : "xa"} mức lý tưởng hơn`}
              >
                {deltaPoints > 0 ? "▲" : "▼"} {Math.abs(deltaPoints).toFixed(1)}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
