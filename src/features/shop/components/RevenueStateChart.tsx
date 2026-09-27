import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MONEY_STATES, type RevenueChartRow } from "./revenueChartRow";

const formatVnd = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);

/**
 * Bốn lớp của MỘT cột, xếp chồng liền nhau theo đúng vòng đời của tiền, đọc từ trên xuống:
 * chưa thanh toán → đã thanh toán, đang giao → đã hoàn thành → hoàn hàng (đáy).
 *
 * Thứ tự khai báo ở đây là thứ tự Recharts xếp chồng **từ đáy lên**, nên mảng này đi ngược vòng đời:
 * `refunded` nằm đầu mảng vì nó nằm dưới cùng của cột. Đổi thứ tự mảng = đổi thứ tự lớp trên hình.
 *
 * Hình thức mang đúng nghĩa của từng chặng, không phải bốn màu tuỳ ý: nét đứt rỗng ruột = tiền chưa chắc
 * về · viền liền ruột đục nhạt = đã trả nhưng việc chưa xong · đặc = chắc chắn · cam = chảy ngược.
 * Nhãn/màu lấy từ `MONEY_STATES` dùng chung với bảng "Trạng thái đơn hàng" — sửa một chỗ, hai nơi khớp.
 */
const LAYERS = [
  {
    key: "refunded" as const,
    state: MONEY_STATES.Refunded,
    color: "#f59e0b",
    variant: "solid" as const,
    swatch: <span className="inline-block h-3 w-3 rounded-[2px] bg-amber-500" />,
  },
  {
    key: "completed" as const,
    state: MONEY_STATES.Completed,
    color: "var(--color-primary)",
    variant: "solid" as const,
    swatch: <span className="inline-block h-3 w-3 rounded-[2px] bg-primary" />,
  },
  {
    key: "inProgress" as const,
    state: MONEY_STATES.Paid,
    color: "var(--color-primary)",
    variant: "tinted" as const,
    swatch: (
      <span className="inline-block h-3 w-3 rounded-[2px] border-2 border-primary bg-primary/25" />
    ),
  },
  {
    key: "awaiting" as const,
    state: MONEY_STATES.Ordered,
    color: "var(--color-primary)",
    variant: "dashed" as const,
    swatch: (
      <span className="inline-block h-3 w-3 rounded-[2px] border-2 border-dashed border-primary" />
    ),
  },
];

/** Thứ tự từ ĐÁY lên — dùng để biết lớp nào đang ở đỉnh/đáy của từng cột mà bo góc cho đúng. */
const STACK_ORDER = LAYERS.map((l) => l.key);

type LayerVariant = (typeof LAYERS)[number]["variant"];
type LayerKey = (typeof LAYERS)[number]["key"];

/** Bán kính bo góc — CHỈ ở đỉnh cột. Đáy nằm trên trục nên bo ở đó chỉ làm cột như bị kênh lên. */
const RADIUS = 5;

/**
 * Đường viền một khối có bán kính riêng cho góc trên và góc dưới. Không dùng `<rect rx>` được vì rx bo
 * CẢ BỐN góc: lớp giữa cũng bị bo và cột hở ra những khe hình thoi ở chỗ hai lớp gặp nhau.
 */
function roundedPath(x: number, y: number, w: number, h: number, rTop: number, rBottom: number) {
  const top = Math.max(0, Math.min(rTop, w / 2, h / 2));
  const bottom = Math.max(0, Math.min(rBottom, w / 2, h / 2));
  return [
    `M${x + top},${y}`,
    `H${x + w - top}`,
    top ? `A${top},${top} 0 0 1 ${x + w},${y + top}` : "",
    `V${y + h - bottom}`,
    bottom ? `A${bottom},${bottom} 0 0 1 ${x + w - bottom},${y + h}` : "",
    `H${x + bottom}`,
    bottom ? `A${bottom},${bottom} 0 0 1 ${x},${y + h - bottom}` : "",
    `V${y + top}`,
    top ? `A${top},${top} 0 0 1 ${x + top},${y}` : "",
    "Z",
  ].join(" ");
}

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: RevenueChartRow;
  color: string;
  variant: LayerVariant;
  layerKey: LayerKey;
}

/**
 * Vẽ một lớp của cột. Các lớp **nối liền nhau** (không khe hở) để cột đọc như một cột tiền duy nhất; thứ
 * tự và hình thức mới là thứ phân biệt từng chặng. Góc chỉ bo ở lớp trên cùng / dưới cùng CỦA CHÍNH CỘT
 * ĐÓ — lớp nào đang là đỉnh phụ thuộc dữ liệu của mốc (nhiều mốc không có đủ bốn lớp). `isBottom` vẫn cần
 * để biết cạnh dưới có phải mép ngoài không (viền phải thụt vào), dù đáy không bo góc.
 */
function StateBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
  color,
  variant,
  layerKey,
}: BarShapeProps) {
  if (height <= 0 || width <= 0) return null;

  const present = STACK_ORDER.filter((k) => (payload?.[k] ?? 0) > 0);
  const isBottom = present[0] === layerKey;
  const isTop = present[present.length - 1] === layerKey;

  const outlined = variant === "tinted" || variant === "dashed";
  const stroke = 2;
  // Viền vẽ GIỮA đường biên nên phải thụt vào nửa nét, nếu không nó tràn ra ngoài khối. Nhưng chỉ thụt ở
  // cạnh NGOÀI của cột: thụt cả cạnh trong thì giữa hai lớp hở ra một khe 2px và cột gãy làm đôi.
  const inset = outlined ? stroke / 2 : 0;
  const top = y + (isTop ? inset : 0);
  const bottom = y + height - (isBottom ? inset : 0);
  const d = roundedPath(
    x + inset,
    top,
    Math.max(0, width - inset * 2),
    Math.max(0, bottom - top),
    isTop ? RADIUS : 0,
    0,
  );

  return (
    <path
      d={d}
      fill={variant === "solid" ? color : variant === "tinted" ? color : "transparent"}
      // "Đã thanh toán" đục nhẹ: nhìn ra là đã có tiền, nhưng vẫn nhạt hơn hẳn phần đã hoàn thành.
      fillOpacity={variant === "tinted" ? 0.22 : 1}
      stroke={outlined ? color : "none"}
      strokeWidth={outlined ? stroke : 0}
      strokeDasharray={variant === "dashed" ? "6 4" : undefined}
    />
  );
}

/**
 * Biểu đồ doanh thu theo mốc thời gian, mỗi cột chồng 4 trạng thái tiền.
 *
 * Chú giải nằm TRONG khung biểu đồ và chi tiết nằm trong tooltip — không có dòng "di chuột để xem" bên
 * ngoài: một dòng hướng dẫn chiếm chỗ vĩnh viễn để nói một việc người dùng làm đúng một lần.
 */
export default function RevenueStateChart({
  data,
  height = 288,
  fallback = false,
}: {
  data: RevenueChartRow[];
  height?: number;
  /** true = máy chủ chưa trả `revenueSeries`, đang vẽ 6 tháng dựng ở client. */
  fallback?: boolean;
}) {
  return (
    <div className="flex flex-col" style={{ height }}>
      {/* Nói ra khi đang chạy đường dự phòng: nút Tuần/Tháng/Quý sẽ KHÔNG đổi gì, và im lặng ở đây khiến
          người dùng tưởng nút hỏng thay vì biết máy chủ đang chạy bản cũ. */}
      {fallback && (
        <p className="mb-1 text-xs text-amber-600">
          Máy chủ chưa trả dữ liệu theo mốc - đang hiển thị 6 tháng gần nhất, nút chọn mốc chưa có
          tác dụng.
        </p>
      )}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500">
        {[...LAYERS].reverse().map((l) => (
          <span key={l.key} className="flex items-center gap-1.5" title={l.state.hintVi}>
            {l.swatch}
            {l.state.labelVi}
          </span>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}tr`
                  : v >= 1_000
                    ? `${Math.round(v / 1_000)}K`
                    : String(v)
              }
            />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.035)" }} content={<StateTooltip />} />
            {LAYERS.map((l) => (
              <Bar
                key={l.key}
                dataKey={l.key}
                stackId="money"
                shape={<StateBar color={l.color} variant={l.variant} layerKey={l.key} />}
                maxBarSize={40}
                // Đổi mốc thì cột "chạy" sang hình mới thay vì nháy một phát. 450ms đủ thấy chuyển động
                // mà không làm người dùng phải chờ; Recharts chỉ animate thuộc tính hình học nên rẻ.
                isAnimationActive
                animationDuration={450}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload?: RevenueChartRow }[];
  label?: string;
}

/** Chi tiết một mốc: từng trạng thái + số đơn, và tổng "tiền đang nằm ở mốc này". */
function StateTooltip({ active, payload, label }: TooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  const byKey = Object.fromEntries(LAYERS.map((l) => [l.key, l])) as Record<
    LayerKey,
    (typeof LAYERS)[number]
  >;
  const rows = [
    { l: byKey.awaiting, value: row.awaiting, count: row.awaitingCount },
    { l: byKey.inProgress, value: row.inProgress, count: row.inProgressCount },
    { l: byKey.completed, value: row.completed, count: row.completedCount },
    { l: byKey.refunded, value: row.refunded, count: row.refundedCount },
  ].filter((r) => r.value > 0 || r.count > 0);

  return (
    <div
      className="rounded-xl border border-gray-200 p-3 text-[13px] shadow-lg backdrop-blur-[3px]"
      style={{ background: "rgba(255,255,255,0.97)" }}
    >
      <p className="mb-1.5 font-semibold text-gray-900">{label}</p>
      {rows.length === 0 ? (
        <p className="text-gray-500">Không có đơn nào trong mốc này.</p>
      ) : (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1">
          {rows.map((r) => (
            <span key={r.l.state.code} className="contents">
              <span className="flex items-center">{r.l.swatch}</span>
              <span className="text-gray-600">
                {r.l.state.labelVi}
                <span className="text-gray-400"> · {r.count} đơn</span>
              </span>
              <span className="text-right font-medium tabular-nums text-gray-900">
                {formatVnd(r.value)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
