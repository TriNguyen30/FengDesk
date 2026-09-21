import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ElementIcon, RadarTooltipFrame } from "./RadarTooltipFrame";
import type { CurrentContribution, ElementAnalysisRow } from "@/features/users/types/workspace";
import {
  TAG_GAP_THRESHOLD,
  elementColor,
  elementVi,
  fitToneByDistance,
  gapStatus,
  type GapStatus,
} from "./constants";

interface ElementRadarChartProps {
  rows: ElementAnalysisRow[];
  /** true → vẽ thêm lớp "xem trước" (sản phẩm đã mua đang giao tới) bằng nét đứt màu primary. */
  showPreview?: boolean;
  /**
   * Nhãn của lớp xem trước trong legend/tooltip. Mặc định nói về hàng đang giao; khi user hover một
   * sản phẩm trong panel bên dưới thì đổi thành tên sản phẩm đó để lớp nét đứt không bị hiểu nhầm.
   */
  previewLabel?: string;
  /**
   * Nguồn tạo nên vector hiện tại (nền phòng / tag user khai / sản phẩm đã đặt).
   * Tổng % của mọi nguồn trên 1 hành = đúng con số "Hiện tại" của hành đó — nên tooltip
   * chỉ ra được "hành này cao là do tag nào", không phải nói suông.
   */
  contributions?: CurrentContribution[];
  /**
   * v3.5 — hệ số cap phiếu tag BE đã áp (`TAG_VOTES_CAP`). `< 1` ⇒ tooltip ghi chú "N tag đang tính bằng
   * 5 phiếu" dưới danh sách nguồn, để user không thắc mắc vì sao 8 tag mà mỗi tag chỉ vài %.
   * Số % trong tooltip đã đúng sẵn (BE trả phiếu sau khi nhân) — đây chỉ là câu giải thích.
   */
  tagVotesScale?: number;
  /**
   * Lớp "Phần của bạn" — phần đóng góp của CHỦ NHÂN phòng vào chính vector `Hiện tại`.
   *
   * Chủ nhân là một nguồn phiếu trong `current` (ngang hàng nền phòng và các tag), nên phần của họ
   * **nằm gọn bên trong** lớp "Hiện tại" theo từng trục — nó là một số hạng không âm của tổng đó.
   * Σ của lớp này = đúng `sharePercent` của chủ nhân, không phải 1.
   *
   * Thay cho lớp `T = (1−Wp)·adjustedIdeal + Wp·personalVector` trước đây: khi bản mệnh đã thật sự
   * nằm trong `current`, vẽ thêm `T` là **đếm ảnh hưởng của bản mệnh hai lần**.
   */
  personalTarget?: { element: string; value: number }[];
  /** Nhãn cạnh legend, vd "3 phiếu". */
  personalTargetLabel?: string;
  /**
   * Hành mà hệ thống KHÔNG ưu tiên bù (`d < 0`) — chỉ hiện trong tooltip, KHÔNG đánh dấu riêng trên trục.
   *
   * Trước đây nó được tô đỏ kèm nhãn "Hành đang bị khắc", và đó là **sai tên**: `d < 0` phần lớn là do
   * PHÒNG đang thừa hành đó, chẳng liên quan gì tới khắc mệnh. Ví dụ thật: chủ phòng mệnh Kim, phòng
   * thừa Kim ⇒ `d[Kim] < 0` ⇒ trục Kim bị tô đỏ và gọi là "bị khắc", trong khi Kim tỷ hòa hoàn toàn
   * với chính bản mệnh chủ phòng. Muốn nói "khắc bản mệnh" thì nguồn đúng là `r < 0`, không phải `d`.
   */
  deprioritizedElements?: string[];
  /** Lý do hệ thống không ưu tiên bù hành đó — hiện trong tooltip. */
  deprioritizedReasons?: Record<string, string>;
}

/**
 * "gấp 2.5 lần" / "còn 40% mức cần" — diễn đạt độ lệch theo TỈ LỆ với chính mục tiêu của trục đó.
 *
 * Bổ sung cho nhãn mức độ (vốn đo lệch tuyệt đối) chứ không thay thế: lệch tuyệt đối mới là thứ đo
 * đúng ảnh hưởng lên một vector Σ=1, còn tỉ lệ mới cho biết trục đó lệch "nặng" tới đâu so với chuẩn
 * của riêng nó. Thiếu một trong hai là đọc sót.
 */
function ratioLabel(current: number, ideal: number): string {
  if (ideal <= 0) return current > 0 ? "không có trong mức lý tưởng" : "-";

  const ratio = current / ideal;
  if (ratio >= 1.15) return `gấp ${ratio.toFixed(1)} lần`;
  if (ratio <= 0.85) return `còn ${Math.round(ratio * 100)}% mức cần`;
  return "đúng mức";
}

/** Số nguồn tối đa liệt kê trong tooltip — còn lại gộp thành "nguồn khác". */
const MAX_TOOLTIP_SOURCES = 4;

/** Vàng = thừa (cùng tông với lớp "Nên bù thêm"), xanh = thiếu. Đỏ để dành cho lỗi thật. */
const MARK_COLOR: Record<Exclude<GapStatus, "balanced">, string> = {
  surplus: "#b8860b",
  deficit: "#2563eb",
};

const SOURCE_DOT: Record<CurrentContribution["source"], string> = {
  Interior: "#d6d3d1",
  Tag: "#7d8f69",
  Product: "var(--color-primary-dark)",
  Person: "#D9AD41",
};

/**
 * Radar 5 trục ngũ hành: nét đứt xám = mức lý tưởng, nét liền có fill = hiện tại,
 * nét đứt primary (khi showPreview) = phòng SẼ trông thế nào khi hàng đang giao được đặt vào.
 * Animation bật để radar "morph" mượt khi đặt/gỡ/chuyển sản phẩm giữa các phòng.
 */
export default function ElementRadarChart({
  rows,
  showPreview = false,
  previewLabel = "Xem trước (hàng đang giao)",
  contributions = [],
  tagVotesScale = 1,
  personalTarget,
  personalTargetLabel,
  deprioritizedElements = [],
  deprioritizedReasons = {},
}: ElementRadarChartProps) {
  const targetByElement = new Map((personalTarget ?? []).map((p) => [p.element, p.value]));
  const showTarget = (personalTarget?.length ?? 0) > 0;
  const isDeprioritized = (element: string) => deprioritizedElements.includes(element);

  // v3.5 — câu ghi chú cap phiếu tag. `votes` BE trả về đã nhân hệ số, nên Σ phiếu tag = đúng trần.
  const tagRows = contributions.filter((c) => c.source === "Tag");
  const tagCount = tagRows.length;
  const cappedTagVotes = Math.round(tagRows.reduce((sum, c) => sum + (c.votes ?? 0), 0));

  /**
   * Trục thừa/thiếu đọc thẳng từ `gap` — đây là radar CỦA PHÒNG nên thứ đáng đánh dấu là phòng đang
   * lệch hành nào, hai chiều chứ không chỉ một. Dùng lại đúng `TAG_GAP_THRESHOLD` của hàng chip phía
   * trên, để chip và radar không bao giờ nói khác nhau về cùng một hành.
   */
  const gapByElement = new Map<string, number>(rows.map((r) => [r.element as string, r.gap ?? 0]));
  const gapMark = (element: string): GapStatus =>
    gapStatus(gapByElement.get(element) ?? 0, TAG_GAP_THRESHOLD);

  /** Màu của dấu lệch; `balanced` không có dấu nên không có màu. */
  const markColor = (mark: GapStatus): string =>
    mark === "balanced" ? "#9ca3af" : MARK_COLOR[mark];
  /** Các nguồn đóng góp vào 1 hành, giảm dần theo % — dùng cho tooltip. */
  const sourcesFor = (element: string) =>
    contributions
      .map((c) => ({
        label: c.label,
        source: c.source,
        percent: c.elements.find((e) => e.element === element)?.percent ?? 0,
      }))
      .filter((c) => c.percent > 0)
      .sort((a, b) => b.percent - a.percent);

  const data = rows.map((row) => ({
    element: row.element,
    label: elementVi(row.element),
    ideal: Math.max(0, Math.min(1, row.adjustedIdeal)),
    current: Math.max(0, Math.min(1, row.current)),
    preview: Math.max(0, Math.min(1, row.previewCurrent ?? row.current)),
    target: Math.max(0, Math.min(1, targetByElement.get(row.element) ?? 0)),
  }));

  const labelToElement = Object.fromEntries(data.map((d) => [d.label, d.element]));

  const radarTick = (props: any) => {
    const { x, y, payload } = props;
    const element = labelToElement[payload?.value] ?? payload?.value;
    // Thừa và thiếu đều là "lệch" và đều đáng biết — đánh dấu CẢ HAI chiều, chỉ khi vượt ngưỡng.
    const mark = gapMark(element);
    const color = elementColor(element);
    const size = 16;

    const icon = (element: string) => <ElementIcon element={element} color={color} size={size} />;

    const tickOffset = (element: string) => {
      switch (element) {
        case "Kim":
          return { dx: 0, dy: -10 };
        case "Mộc":
        case "Moc":
          return { dx: 10, dy: -4 };
        case "Thủy":
        case "Thuy":
          return { dx: 10, dy: 4 };
        case "Hỏa":
        case "Hoa":
          return { dx: -10, dy: 4 };
        case "Thổ":
        case "Tho":
          return { dx: -10, dy: -4 };
        default:
          return { dx: 0, dy: 0 };
      }
    };

    const { dx, dy } = tickOffset(payload?.value);

    return (
      <g transform={`translate(${x + dx - size / 2}, ${y + dy - size / 2})`}>
        {icon(payload?.value)}
        {mark !== "balanced" && (
          <text
            x={size + 1}
            y={5}
            fontSize={11}
            fontWeight={700}
            fill={markColor(mark)}
            aria-label={mark === "surplus" ? "thừa" : "thiếu"}
          >
            {mark === "surplus" ? "↑" : "↓"}
          </text>
        )}
      </g>
    );
  };

  // Mặc định phóng to đến 45%; nếu có hành vượt 45% thì scale theo giá trị lớn nhất đó.
  const maxValue = Math.max(
    ...data.flatMap((d) => [
      d.ideal,
      d.current,
      showPreview ? d.preview : 0,
      showTarget ? d.target : 0,
    ]),
  );
  const domainMax = Math.max(0.45, maxValue);

  //tooltip offset để tooltip không bị che bởi chuột nhưng đang lỗi vl
  const chartHeight = 400;
  const chartOuterRadius = 0.8;
  const tooltipOffset = {
    x: -Math.round(chartHeight * chartOuterRadius * 0.48),
    y: -Math.round(chartHeight * chartOuterRadius * 0.4),
  };

  // Thang 5 tông dùng chung với chip "Hợp với nghề" — sửa màu ở constants.FIT_TONES.
  const hoverStyle = (distance: number) => fitToneByDistance(distance);

  const RadarTooltip = (props: any) => {
    const { active, payload } = props;
    if (!active || !payload || payload.length === 0) return null;

    const payloadItem = payload[0]?.payload;
    if (!payloadItem) return null;

    const element = payloadItem.element;
    const ideal = payloadItem.ideal;
    const current = payloadItem.current;
    const distance = Math.abs(current - ideal);
    const style = hoverStyle(distance);

    // Tổng % các nguồn = đúng con số "Hiện tại" ở trên (cả hai cùng chuẩn hóa theo tổng phiếu).
    const sources = sourcesFor(element);
    const shownSources = sources.slice(0, MAX_TOOLTIP_SOURCES);
    const restPercent = sources.slice(MAX_TOOLTIP_SOURCES).reduce((sum, s) => sum + s.percent, 0);

    return (
      <RadarTooltipFrame element={element} tone={style}>
        <div className="flex items-center justify-between text-[11px]">
          <span>Hiện tại</span>
          <span>{(current * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>Lý tưởng</span>
          <span>{(ideal * 100).toFixed(0)}%</span>
        </div>
        {/* Nhãn mức độ ở trên đo lệch TUYỆT ĐỐI (|hiện tại − lý tưởng|), nên nó cố ý bỏ qua chuyện
              trục đó có mục tiêu to hay nhỏ. Dòng này trả lại bối cảnh: lệch 19 điểm % trên một trục
              lý tưởng 13% là gấp 2.5 lần, khác hẳn lệch 19 điểm % trên trục lý tưởng 39%. */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>So với lý tưởng</span>
          <span>{ratioLabel(current, ideal)}</span>
        </div>
        {showTarget && (
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-[#D9AD41]" />
              Hành của bạn
            </span>
            <span>{((payloadItem.target ?? 0) * 100).toFixed(0)}%</span>
          </div>
        )}

        {gapMark(element) !== "balanced" && (
          <div
            className="mt-2 rounded-lg px-2 py-1.5 text-[11px] leading-snug"
            style={{
              background:
                gapMark(element) === "surplus" ? "rgba(217,173,65,0.16)" : "rgba(59,130,246,0.12)",
              color: markColor(gapMark(element)),
            }}
          >
            {gapMark(element) === "surplus"
              ? `Phòng đang THỪA ${elementVi(element)} so với mức lý tưởng.`
              : `Phòng đang THIẾU ${elementVi(element)} so với mức lý tưởng.`}
          </div>
        )}

        {/* Chỉ hiện khi nó nói THÊM điều gì — phần "phòng đang thừa" đã có ở khối trên rồi. */}
        {isDeprioritized(element) && deprioritizedReasons[element] && (
          <div className="mt-1.5 rounded-lg bg-gray-100 px-2 py-1.5 text-[11px] leading-snug text-gray-600">
            {deprioritizedReasons[element] ??
              `Hệ thống không ưu tiên bù thêm ${elementVi(element)} cho không gian này.`}
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-3 border-t border-black/10 pt-2">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Đến từ
            </p>
            <div className="space-y-1 text-[11px] text-slate-700">
              {shownSources.map((s) => (
                <div key={`${s.source}-${s.label}`} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: SOURCE_DOT[s.source] }}
                  />
                  <span className="min-w-0 flex-1 truncate" title={s.label}>
                    {s.label}
                  </span>
                  <span className="shrink-0 tabular-nums">{s.percent.toFixed(0)}%</span>
                </div>
              ))}
              {restPercent > 0 && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <span className="min-w-0 flex-1 truncate">
                    {sources.length - shownSources.length} nguồn khác
                  </span>
                  <span className="shrink-0 tabular-nums">{restPercent.toFixed(0)}%</span>
                </div>
              )}
            </div>
            {tagVotesScale < 1 && tagCount > 0 && (
              <p className="mt-1.5 text-[10px] leading-snug text-slate-500">
                {tagCount} tag đang tính bằng {cappedTagVotes} phiếu (trần phiếu tag), để nền phòng,
                bạn và sản phẩm không bị đè.
              </p>
            )}
          </div>
        )}
      </RadarTooltipFrame>
    );
  };

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} outerRadius="80%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="label" tick={radarTick} />
          <PolarRadiusAxis
            type="number"
            domain={[0, domainMax]}
            allowDecimals
            tick={false}
            axisLine={false}
          />
          {/* Lý tưởng = CHẤM mảnh xám (mốc tham chiếu, đứng yên); Xem trước = GẠCH dài đậm màu primary có chấm
              đỉnh (thứ sẽ thay đổi). Trước đây cả hai đều gạch nét ~4px, khác mỗi màu ⇒ nhìn lướt là lẫn. */}
          <Radar
            name="Mức lý tưởng"
            dataKey="ideal"
            stroke="#a8a29e"
            strokeDasharray="1.5 3.5"
            strokeLinecap="round"
            strokeWidth={1.75}
            fill="none"
            dot={false}
            isAnimationActive={false}
          />
          <Radar
            name="Hiện tại"
            dataKey="current"
            stroke="#7d8f69"
            strokeWidth={2}
            fill="#7d8f69"
            fillOpacity={0.25}
            dot={(props) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  key={`dot-${payload.element}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={elementColor(payload.element)}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={(props) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  key={`active-dot-${payload.element}`}
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill={elementColor(payload.element)}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
            // Bật animation: đặt/gỡ/chuyển sản phẩm giữa phòng → hình radar morph mượt.
            isAnimationActive
            animationDuration={600}
            animationEasing="ease-out"
          />
          {showTarget && (
            <Radar
              // Khớp legend + tooltip bên dưới. Lớp này KHÔNG còn là `T` (mục tiêu trộn bản mệnh) —
              // nó là phần đóng góp của chủ nhân NẰM TRONG `Hiện tại`, nên gọi "Mục tiêu của bạn" là
              // tên cũ đã sai nghĩa.
              name="Hành của bạn"
              dataKey="target"
              stroke="#D9AD41"
              strokeWidth={2}
              // CÓ fill: đây là một số hạng không âm của `Hiện tại` trên từng trục, nên tô đặc đọc
              // đúng là "phần này của bạn" chứ không phải một đường mục tiêu riêng.
              fill="#D9AD41"
              fillOpacity={0.22}
              dot={false}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
          )}
          {showPreview && (
            <Radar
              name={previewLabel}
              dataKey="preview"
              stroke="var(--color-primary-dark)"
              strokeDasharray="9 5"
              strokeWidth={2.5}
              fill="var(--color-primary)"
              fillOpacity={0.08}
              dot={{ r: 2.5, fill: "var(--color-primary-dark)", stroke: "#fff", strokeWidth: 1 }}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
          )}
          <Tooltip
            content={<RadarTooltip />}
            offset={tooltipOffset}
            reverseDirection={{ x: false, y: false }}
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ overflow: "visible" }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-5 border-t-2 border-dotted border-[#a8a29e]" />
          Mức lý tưởng
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#7d8f69]/70" />
          Hiện tại
        </span>
        {showPreview && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-5 border-t-[3px] border-dashed border-primary-dark" />
            {previewLabel}
          </span>
        )}
        {showTarget && (
          <span
            className="flex items-center gap-1.5"
            title={
              personalTargetLabel
                ? `Bản mệnh của bạn nặng ${personalTargetLabel} trong hiện trạng phòng`
                : undefined
            }
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#D9AD41]/80" />
            Bản mệnh của bạn
          </span>
        )}
      </div>
    </div>
  );
}
