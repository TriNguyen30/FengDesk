import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Circle, Leaf, Droplets, Flame, Mountain } from "lucide-react";
import type { ElementAnalysisRow } from "@/features/users/types/workspace";
import { elementColor, elementVi } from "./constants";

interface ElementRadarChartProps {
  rows: ElementAnalysisRow[];
  /** true → vẽ thêm lớp "xem trước" (sản phẩm đã mua đang giao tới) bằng nét đứt màu primary. */
  showPreview?: boolean;
}

/**
 * Radar 5 trục ngũ hành: nét đứt xám = mức lý tưởng, nét liền có fill = hiện tại,
 * nét đứt primary (khi showPreview) = phòng SẼ trông thế nào khi hàng đang giao được đặt vào.
 * Animation bật để radar "morph" mượt khi đặt/gỡ/chuyển sản phẩm giữa các phòng.
 */
export default function ElementRadarChart({ rows, showPreview = false }: ElementRadarChartProps) {
  const data = rows.map((row) => ({
    element: row.element,
    label: elementVi(row.element),
    ideal: Math.max(0, Math.min(1, row.adjustedIdeal)),
    current: Math.max(0, Math.min(1, row.current)),
    preview: Math.max(0, Math.min(1, row.previewCurrent ?? row.current)),
  }));

  const labelToElement = Object.fromEntries(data.map((d) => [d.label, d.element]));

  const radarTick = (props: any) => {
    const { x, y, payload } = props;
    const element = labelToElement[payload?.value] ?? payload?.value;
    const color = elementColor(element);
    const size = 16;

    const icon = (element: string) => {
      switch (element) {
        case "Kim":
          return <Circle size={size} strokeWidth={1.5} fill="none" stroke={color} />;
        case "Mộc":
        case "Moc":
          return <Leaf size={size} strokeWidth={1.5} fill="none" stroke={color} />;
        case "Thủy":
        case "Thuy":
          return <Droplets size={size} strokeWidth={1.5} fill="none" stroke={color} />;
        case "Hỏa":
        case "Hoa":
          return <Flame size={size} strokeWidth={1.5} fill="none" stroke={color} />;
        case "Thổ":
        case "Tho":
          return <Mountain size={size} strokeWidth={1.5} fill="none" stroke={color} />;
        default:
          return <Circle size={size} strokeWidth={1.5} fill="none" stroke={color} />;
      }
    };

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
      </g>
    );
  };

  // Mặc định phóng to đến 45%; nếu có hành vượt 45% thì scale theo giá trị lớn nhất đó.
  const maxValue = Math.max(...data.flatMap((d) => [d.ideal, d.current, showPreview ? d.preview : 0]));
  const domainMax = Math.max(0.45, maxValue);

  //tooltip offset để tooltip không bị che bởi chuột nhưng đang lỗi vl
  const chartHeight = 400;
  const chartOuterRadius = 0.8;
  const tooltipOffset = {
    x: -Math.round(chartHeight * chartOuterRadius * 0.48),
    y: -Math.round(chartHeight * chartOuterRadius * 0.4),
  };

  const hoverStyle = (distance: number) => {
    if (distance <= 0.05) {
      return {
        background: "rgba(99, 197, 75, 0.18)",
        border: "#78c539",
        label: "Tối ưu",
        tone: "text-emerald-800",
      };
    }
    if (distance <= 0.1) {
      return {
        background: "rgba(152, 204, 56, 0.14)",
        border: "#9acd3b",
        label: "Đạt chuẩn",
        tone: "text-lime-800",
      };
    }
    if (distance <= 0.15) {
      return {
        background: "rgba(251, 191, 36, 0.18)",
        border: "#fbbf24",
        label: "Ổn định",
        tone: "text-amber-800",
      };
    }
    if (distance <= 0.2) {
      return {
        background: "rgba(249, 115, 22, 0.18)",
        border: "#f97316",
        label: "Cần xem xét",
        tone: "text-orange-800",
      };
    }
    return {
      background: "rgba(239, 68, 68, 0.18)",
      border: "#ef4444",
      label: "Cần điều chỉnh",
      tone: "text-red-700",
    };
  };

  const iconForTooltip = (element: string, color: string) => {
    const size = 18;
    switch (element) {
      case "Kim":
        return <Circle size={size} strokeWidth={1.5} fill="none" stroke={color} />;
      case "Mộc":
      case "Moc":
        return <Leaf size={size} strokeWidth={1.5} fill="none" stroke={color} />;
      case "Thủy":
      case "Thuy":
        return <Droplets size={size} strokeWidth={1.5} fill="none" stroke={color} />;
      case "Hỏa":
      case "Hoa":
        return <Flame size={size} strokeWidth={1.5} fill="none" stroke={color} />;
      case "Thổ":
      case "Tho":
        return <Mountain size={size} strokeWidth={1.5} fill="none" stroke={color} />;
      default:
        return <Circle size={size} strokeWidth={1.5} fill="none" stroke={color} />;
    }
  };

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
    const color = elementColor(element);

    return (
      <div
        className="w-[150px] rounded-xl border p-3 text-xs shadow-lg backdrop-blur-[3px]"
        style={{ background: style.background, borderColor: style.border }}
      >
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="inline-flex items-center justify-center rounded-full bg-white p-1 shadow-sm">
            {iconForTooltip(element, color)}
          </span>
          <span>{elementVi(element)}</span>
        </div>
        <div className="rounded-full bg-black/5 px-3 py-2 text-[11px] font-medium text-slate-700">
          <span className={style.tone}>{style.label}</span>
        </div>
        <div className="mt-3 space-y-2 text-slate-700">
          <div className="flex items-center justify-between text-[11px]">
            <span>Hiện tại</span>
            <span>{(current * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Lý tưởng</span>
            <span>{(ideal * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
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
          <Radar
            name="Mức lý tưởng"
            dataKey="ideal"
            stroke="#a8a29e"
            strokeDasharray="4 3"
            strokeWidth={1.5}
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
          {showPreview && (
            <Radar
              name="Xem trước (hàng đang giao)"
              dataKey="preview"
              stroke="var(--color-primary-dark)"
              strokeDasharray="6 4"
              strokeWidth={2}
              fill="var(--color-primary)"
              fillOpacity={0.08}
              dot={false}
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
      <div className="mt-1 flex items-center justify-center gap-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-[#a8a29e]" />
          Mức lý tưởng
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#7d8f69]/70" />
          Hiện tại
        </span>
        {showPreview && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0 w-4 border-t-2 border-dashed border-primary" />
            Xem trước
          </span>
        )}
      </div>
    </div>
  );
}
