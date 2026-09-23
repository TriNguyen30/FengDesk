/** Mốc thời gian của biểu đồ doanh thu — khớp đúng 4 giá trị BE nhận ở `?range=`. */
export const STATS_RANGES = [
  { code: "week", label: "Tuần" },
  { code: "month", label: "Tháng" },
  { code: "quarter", label: "Quý" },
  { code: "year", label: "Năm nay" },
] as const;

export type StatsRange = (typeof STATS_RANGES)[number]["code"];
