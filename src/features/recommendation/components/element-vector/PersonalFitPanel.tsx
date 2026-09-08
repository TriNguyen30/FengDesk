import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { CalendarPlus } from "lucide-react";
import { usePersonalFit } from "../../hooks/useProductFit";
import ScoreBadge from "./ScoreBadge";
import ScoreWaterfall from "./ScoreWaterfall";
import { ClashBadge } from "./ClashNotices";
import { ELEMENT_ORDER, elementVi } from "./constants";
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
    return <div className="h-56 animate-pulse rounded-2xl bg-gray-50" />;
  }

  // Thiếu ngày sinh (422) là trường hợp thường gặp nhất, và nó có hành động rõ ràng — mời khai ngày
  // sinh thay vì báo "không tải được".
  if (status === "error" || !fit) {
    return <MissingBirthDateState message={messageOf(error)} />;
  }

  const need = toMap(fit.personalNeedVector);
  const product = toMap(fit.productVector);
  const data = ELEMENT_ORDER.map((element) => ({
    element,
    label: elementVi(element),
    need: need[element],
    product: product[element],
  }));
  const domainMax = Math.max(0.45, ...data.flatMap((d) => [d.need, d.product]));

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-sm font-extrabold text-gray-900">
          Độ phù hợp với bản mệnh của bạn
        </span>
      </div>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <ScoreBadge score={fit.score} />
              <ClashBadge breakdown={fit.breakdown} />
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Bản mệnh</div>
              <div className="text-sm font-semibold text-gray-700">{fit.destinyLabelVi}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:items-center">
            <div className="min-w-0">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={data} outerRadius="80%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <PolarRadiusAxis
                    type="number"
                    domain={[0, domainMax]}
                    tick={false}
                    axisLine={false}
                  />
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
                </RadarChart>
              </ResponsiveContainer>

              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#D9AD41]/80" />
                  Dụng thần của bạn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#7d8f69]/80" />
                  Sản phẩm
                </span>
              </div>

              <p className="mt-1.5 text-center text-[11px] leading-snug text-gray-400">
                Vật mang theo người — chấm theo bản mệnh, không phụ thuộc phòng hay hướng đặt.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {fit.breakdown && <ScoreWaterfall breakdown={fit.breakdown} />}

              {fit.matchFacts.length > 0 && (
                <ul className="space-y-1 text-xs leading-relaxed text-gray-600">
                  {fit.matchFacts.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              )}

              {fit.cautionFacts.length > 0 && (
                <div className="rounded-lg bg-[#fdecea] px-3 py-2 text-xs leading-relaxed text-[#b3261e]">
                  {fit.cautionFacts.map((c, i) => (
                    <p key={i}>{c}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">{message}</p>
      <a
        href="/profile"
        className="mt-3 inline-block rounded-full bg-[#D9AD41] px-4 py-1.5 text-xs font-semibold text-white"
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
