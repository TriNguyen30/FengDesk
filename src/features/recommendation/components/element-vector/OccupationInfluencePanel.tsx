import { Briefcase } from "lucide-react";
import type { ScoreBreakdown } from "../../types/recommendation";
import { elementColor, elementVi } from "./constants";

interface OccupationInfluencePanelProps {
  breakdown: ScoreBreakdown;
}

/** Dưới mức này thì làm tròn hiển thị đã về 0.00 — coi như nghề không chạm tới hành đó. */
const VISIBLE = 0.005;

/**
 * "Nghề của bạn đã kéo hành nào lên/xuống" - v3.2 §11 (P5).
 *
 * Vẽ bằng THANH CÓ DẤU chứ không chồng lên radar chính: `occupationShift` nằm trên thang [−1,+1] có
 * dấu, còn radar chính là các vector Σ=1 không âm. Hai thang khác nhau, chồng lên nhau là so sai -
 * đúng cái bẫy đã loại `priorityVector` khỏi radar phòng ở §10.3.
 *
 * Con số hiển thị là mức dịch THẬT (`r' − r`, đo SAU khi chặn), không phải `delta × share` danh
 * nghĩa. Nên một hành khắc bản mệnh sẽ hiện gần 0 dù bảng delta khai lớn - và đó chính là điều user
 * cần thấy: nghề nghiệp đổi được mức ƯA THÍCH, không đổi được bản mệnh.
 */
export default function OccupationInfluencePanel({ breakdown }: OccupationInfluencePanelProps) {
  const occupation = breakdown.occupation;
  const shift = breakdown.vectors.occupationShift;
  if (!occupation || !shift) return null;

  const rows = shift
    .filter((row) => Math.abs(row.value) >= VISIBLE)
    .sort((a, b) => b.value - a.value);
  if (rows.length === 0) return null;

  // Chuẩn hoá độ dài thanh theo mức dịch LỚN NHẤT đang hiện, không theo trần lý thuyết 1.0: delta
  // nghề nghiệp thực tế chỉ cỡ 0.1-0.2 nên lấy trần 1.0 sẽ cho ra năm cái gạch không đọc được gì.
  const maxAbs = Math.max(...rows.map((row) => Math.abs(row.value)));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          <Briefcase size={13} />
          {occupation.nameVi}
        </span>
        <span className="text-[11px] text-gray-500">
          hệ số {occupation.share.toFixed(2)}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {rows.map((row) => {
          const width = `${(Math.abs(row.value) / maxAbs) * 100}%`;
          const up = row.value > 0;
          return (
            <div key={row.element} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-[11px] text-gray-600">
                {elementVi(row.element)}
              </span>
              {/* Hai nửa quanh trục giữa: sang phải là nghề ưa hành đó, sang trái là nghề kỵ. */}
              <div className="flex min-w-0 flex-1 items-center">
                <div className="flex h-2 flex-1 justify-end">
                  {!up && (
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
                className={`w-12 shrink-0 text-right text-[11px] tabular-nums ${
                  up ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {row.value > 0 ? "+" : ""}
                {row.value.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-gray-500">{occupation.reasonVi}</p>
    </div>
  );
}
