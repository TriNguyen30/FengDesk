import type { ElementAnalysisRow } from "@/features/users/types/workspace";
import {
  ATTENTION_BG,
  ATTENTION_TEXT,
  elementColor,
  elementVi,
  gapStatus,
  type GapStatus,
} from "./constants";

const STATUS_TEXT: Record<GapStatus, string> = {
  deficit: "↑ cần bù",
  surplus: "↓ thừa",
  balanced: "ổn",
};

interface ElementTagsProps {
  rows: ElementAnalysisRow[];
}

/** Dải chip 5 hành: dot màu + tên + trạng thái (cần bù/thừa/ổn) suy từ gap của từng hành. */
export default function ElementTags({ rows }: ElementTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((row) => {
        const status = gapStatus(row.gap);
        const attention = status !== "balanced";
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
                : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }
            }
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: elementColor(row.element) }}
            />
            <span className="font-semibold text-[#111827]">{elementVi(row.element)}</span>
            <span className="font-medium">{STATUS_TEXT[status]}</span>
          </span>
        );
      })}
    </div>
  );
}
