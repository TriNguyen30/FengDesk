import { scorePercent } from "./constants";

interface ScoreBadgeProps {
  /** Điểm engine v3 ∈ [-1,1]. */
  score: number;
  size?: "default" | "sm";
}

interface Tier {
  label: string;
  color: string;
}

function tierFor(score: number): Tier {
  if (score >= 0.6) return { label: "Rất hợp", color: "#7d8f69" };
  if (score >= 0.2) return { label: "Phù hợp", color: "#3b82f6" };
  if (score >= -0.2) return { label: "Trung tính", color: "#c4a86a" };
  return { label: "Cân nhắc", color: "#ef4444" };
}

/** Vòng tròn % + tier chữ — chỉ dùng khi có fit sản phẩm × phòng (không dùng cho vector thuần "space"). */
export default function ScoreBadge({ score, size = "default" }: ScoreBadgeProps) {
  const { label, color } = tierFor(score);
  const pct = scorePercent(score);
  const dim = size === "sm" ? 44 : 56;
  const innerDim = dim - 11;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: dim,
          height: dim,
          background: `conic-gradient(${color} ${pct * 3.6}deg, #eceee9 0deg)`,
        }}
      >
        <div
          className="flex items-center justify-center rounded-full bg-white"
          style={{ width: innerDim, height: innerDim }}
        >
          <span className="font-extrabold leading-none" style={{ color, fontSize: size === "sm" ? 13 : 17 }}>
            {pct}
            <span style={{ fontSize: size === "sm" ? 8 : 9 }}>%</span>
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Độ phù hợp</div>
        <div className="text-lg font-extrabold leading-tight" style={{ color }}>
          {label}
        </div>
      </div>
    </div>
  );
}
