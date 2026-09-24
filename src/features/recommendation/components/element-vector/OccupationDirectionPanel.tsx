import { Briefcase } from "lucide-react";
import type { ScoreBreakdown } from "../../types/recommendation";
import { elementColor, elementVi } from "./constants";

interface OccupationDirectionPanelProps {
  breakdown: ScoreBreakdown;
}

/** Dưới mức này thì làm tròn hiển thị đã về 0.00 — coi như nghề không nghiêng về hành đó. */
const VISIBLE = 0.005;

/**
 * "Nghề của bạn cần hành nào, tránh hành nào" — trục nghề N3 (ADR occupation-product-fit-v1.md §3).
 *
 * Vẽ bằng THANH CÓ DẤU chứ không chồng lên radar chính: `ô` nằm trên thang [−1,+1] có dấu, còn radar
 * chính là các vector Σ=1 không âm. Hai thang khác nhau, chồng lên nhau là so sai — đúng cái bẫy đã
 * loại `priorityVector` khỏi radar phòng ở §10.3.
 *
 * Hiển thị `ô` ĐÃ CHẶN: hành nghề muốn nâng nhưng khắc bản mệnh hiện ở 0 kèm nhãn "khắc mệnh", chứ
 * không hiện con số thô — nói "nghề của bạn cần Kim" trong khi Kim vẫn khắc mệnh là nói dối bằng đồ hoạ.
 * Nghề đổi mức ƯA THÍCH, không đổi được bản mệnh.
 */
export default function OccupationDirectionPanel({ breakdown }: OccupationDirectionPanelProps) {
  const occupation = breakdown.occupation;
  const direction = breakdown.vectors.occupationDirection;
  const raw = breakdown.vectors.occupationRawDirection;
  if (!occupation || !direction) return null;

  const rawByElement = new Map((raw ?? []).map((row) => [row.element, row.value]));

  // Hành bị chặn: nghề muốn nâng (raw > 0) nhưng đã bị kẹp về ≤ 0 vì khắc mệnh.
  const rows = direction
    .map((row) => ({
      element: row.element,
      value: row.value,
      clamped: (rawByElement.get(row.element) ?? 0) >= VISIBLE && row.value < VISIBLE,
    }))
    .filter((row) => Math.abs(row.value) >= VISIBLE || row.clamped)
    .sort((a, b) => b.value - a.value);
  if (rows.length === 0) return null;

  // Chuẩn hoá độ dài thanh theo trục lớn nhất đang hiện: ô đã ở thang ±1 nhưng hồ sơ thật thường
  // chỉ nghiêng 0.25–0.75, lấy trần 1.0 cho ra những cái gạch ngắn khó đọc.
  const maxAbs = Math.max(...rows.map((row) => Math.abs(row.value)), VISIBLE);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[13px] font-medium text-gray-700">
          <Briefcase size={13} />
          Nghề {occupation.nameVi}
        </span>
        <span className="text-xs text-gray-500">trọng số {occupation.weight.toFixed(2)}</span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {rows.map((row) => {
          const width = `${(Math.abs(row.value) / maxAbs) * 100}%`;
          const up = row.value > 0;
          return (
            <div key={row.element} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-gray-600">{elementVi(row.element)}</span>
              {/* Hai nửa quanh trục giữa: sang phải là nghề cần hành đó, sang trái là nghề nên tránh. */}
              <div className="flex min-w-0 flex-1 items-center">
                <div className="flex h-2 flex-1 justify-end">
                  {!up && !row.clamped && (
                    <div
                      className="h-2 rounded-l-sm opacity-60"
                      style={{ width, backgroundColor: elementColor(row.element) }}
                    />
                  )}
                </div>
                <div className="h-3 w-px shrink-0 bg-gray-300" />
                <div className="flex h-2 flex-1">
                  {up && (
                    <div
                      className="h-2 rounded-r-sm"
                      style={{ width, backgroundColor: elementColor(row.element) }}
                    />
                  )}
                </div>
              </div>
              <span
                className={`w-20 shrink-0 text-right text-xs tabular-nums ${
                  row.clamped ? "text-red-500" : up ? "text-positive" : "text-gray-400"
                }`}
              >
                {row.clamped ? "khắc mệnh" : `${row.value > 0 ? "+" : ""}${row.value.toFixed(2)}`}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs leading-snug text-gray-500">{occupation.reasonVi}</p>
    </div>
  );
}
