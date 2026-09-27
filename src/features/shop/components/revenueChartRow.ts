import type { RevenueBucket } from "../types/shop";

/**
 * Bốn trạng thái của dòng tiền, dùng CHUNG cho biểu đồ doanh thu và bảng "Trạng thái đơn hàng" — cùng
 * bảng màu, cùng nét, nên nhìn cột rồi nhìn bảng là khớp ngay.
 *
 * Mã giữ tiếng Anh một từ (`Ordered`/`Paid`/…) vì đó là thứ hiện trong chip hẹp và cũng đúng mã BE trả;
 * tiếng Việt chỉ dùng ở chú giải và tooltip, nơi có đủ chỗ.
 */
export const MONEY_STATES = {
  Ordered: {
    code: "Ordered",
    labelVi: "COD / Chưa thanh toán",
    hintVi:
      "Đơn online khách chưa trả tiền, và đơn COD đang trên đường - COD thu tại điểm giao nên chưa có đồng nào.",
    chipClass: "border border-dashed border-primary bg-primary/10 text-primary",
  },
  Paid: {
    code: "Paid",
    labelVi: "Đã thanh toán, đang giao",
    hintVi: "Khách đã trả tiền online, khâu giao nhận chưa xong.",
    chipClass: "border border-primary bg-primary/25 text-primary",
  },
  Completed: {
    code: "Completed",
    labelVi: "Đã hoàn thành",
    hintVi: "Đã giao tới tay khách - đơn COD tính là thu được tiền ở bước này.",
    chipClass: "bg-primary text-white",
  },
  Refunded: {
    code: "Refunded",
    labelVi: "Đã hoàn tiền",
    hintVi: "Ticket đổi/trả đã hoàn tiền xong - tiền chảy ngược.",
    chipClass: "bg-amber-500 text-white",
  },
} as const;

export type MoneyStateKey = keyof typeof MONEY_STATES;

/** Mã BE (`Ordered|Paid|Completed|Refunded`) → khoá hợp lệ; mã lạ coi như `Ordered` để không vỡ bảng. */
export function moneyStateOf(status: string | null | undefined): MoneyStateKey {
  return status && status in MONEY_STATES ? (status as MoneyStateKey) : "Ordered";
}

export interface RevenueChartRow {
  label: string;
  awaiting: number;
  awaitingCount: number;
  inProgress: number;
  inProgressCount: number;
  completed: number;
  completedCount: number;
  refunded: number;
  refundedCount: number;
}

/** `RevenueBucket` của BE → hàng dữ liệu của chart. Thiếu trường (BE cũ) thì về 0, cột vẫn vẽ được. */
export function toChartRow(b: RevenueBucket): RevenueChartRow {
  return {
    label: b.labelVi,
    awaiting: b.awaitingPayment ?? 0,
    awaitingCount: b.awaitingPaymentCount ?? 0,
    inProgress: b.inProgress ?? 0,
    inProgressCount: b.inProgressCount ?? 0,
    completed: b.completed ?? b.revenue ?? 0,
    completedCount: b.completedCount ?? b.deliveredCount ?? 0,
    refunded: b.refunded ?? 0,
    refundedCount: b.refundedCount ?? 0,
  };
}

/** Cộng hai hàng cùng mốc — dùng khi admin gộp thống kê của nhiều cửa hàng. */
export function mergeChartRows(a: RevenueChartRow, b: RevenueChartRow): RevenueChartRow {
  return {
    label: a.label,
    awaiting: a.awaiting + b.awaiting,
    awaitingCount: a.awaitingCount + b.awaitingCount,
    inProgress: a.inProgress + b.inProgress,
    inProgressCount: a.inProgressCount + b.inProgressCount,
    completed: a.completed + b.completed,
    completedCount: a.completedCount + b.completedCount,
    refunded: a.refunded + b.refunded,
    refundedCount: a.refundedCount + b.refundedCount,
  };
}

export const EMPTY_CHART_ROW: Omit<RevenueChartRow, "label"> = {
  awaiting: 0,
  awaitingCount: 0,
  inProgress: 0,
  inProgressCount: 0,
  completed: 0,
  completedCount: 0,
  refunded: 0,
  refundedCount: 0,
};
