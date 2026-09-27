import { useLayoutEffect, useRef, useState } from "react";
import { ClipboardList } from "lucide-react";
import type { StoreStatisticsItemRow } from "../types/shop";
import { MONEY_STATES, moneyStateOf, type MoneyStateKey } from "./revenueChartRow";
import { STATS_RANGES, type StatsRange } from "./statsRanges";

const formatVnd = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);

/** Nút chọn mốc thời gian của biểu đồ doanh thu — Tuần / Tháng / Quý / Năm nay. */
export function StatsRangeTabs({
  value,
  onChange,
}: {
  value: StatsRange;
  onChange: (next: StatsRange) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Mốc thời gian"
      className="inline-flex rounded-xl bg-gray-100 p-1"
    >
      {STATS_RANGES.map((r) => {
        const active = r.code === value;
        return (
          <button
            key={r.code}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r.code)}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors cursor-pointer ${
              active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

/** Chip trạng thái hình viên nang — cùng bảng màu/nét với các lớp của biểu đồ doanh thu. */
export function MoneyStateChip({ state }: { state: MoneyStateKey }) {
  const s = MONEY_STATES[state];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.chipClass}`}
      title={s.hintVi}
    >
      {s.code}
    </span>
  );
}

/** Số dòng thấy cùng lúc; kéo một nhát nhảy `VISIBLE_ROWS - 1` dòng (chừa 1 dòng gối đầu). */
const VISIBLE_ROWS = 5;

/**
 * "Trạng thái đơn hàng" — sản phẩm nào đang nằm ở khâu nào của dòng tiền, kèm phí ship của dòng đó.
 *
 * Một bảng thay vì hai: tách "chờ thanh toán" ra riêng khiến cùng một sản phẩm nằm ở hai bảng khác nhau
 * tuỳ đơn, trong khi thứ chủ vườn cần là "món này đang kẹt ở đâu". Chip mang đúng màu/nét của lớp tương
 * ứng trên biểu đồ doanh thu, nên nhìn cột rồi nhìn bảng là khớp ngay.
 */
export function StatsPendingItems({ rows }: { rows: StoreStatisticsItemRow[] }) {
  // Chiều cao khung = ĐÚNG N dòng, đo từ dòng thật thay vì đoán bằng hằng số: chỉ cần cỡ chữ hay padding
  // đổi một chút là con số đoán sẽ để lòi nửa dòng ở đáy — đúng thứ làm người đọc tưởng mình bỏ sót.
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => {
      const first = body.rows[0] as HTMLTableRowElement | undefined;
      if (first) setMaxHeight(first.offsetHeight * VISIBLE_ROWS);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [rows.length]);

  if (rows.length === 0) return null;

  // Xếp theo thứ tự vòng đời (Ordered → Refunded) rồi theo tiền, để bảng đọc như một dòng chảy.
  const order: MoneyStateKey[] = ["Ordered", "Paid", "Completed", "Refunded"];
  const sorted = [...rows].sort((a, b) => {
    const d = order.indexOf(moneyStateOf(a.status)) - order.indexOf(moneyStateOf(b.status));
    return d !== 0 ? d : b.value - a.value;
  });
  const scrolls = sorted.length > VISIBLE_ROWS;
  const totalValue = sorted.reduce((sum, r) => sum + r.value, 0);
  const totalShipping = sorted.reduce((sum, r) => sum + (r.shippingFee ?? 0), 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[15px] font-bold text-gray-900">
          <ClipboardList size={16} className="text-primary" />
          Trạng thái đơn hàng
        </span>
        <span className="text-[13px] text-gray-500">
          Tiền hàng <b className="text-gray-800">{formatVnd(totalValue)}</b>
          <span className="mx-1.5 text-gray-300">·</span>
          Phí ship <b className="text-gray-800">{formatVnd(totalShipping)}</b>
        </span>
      </div>

      <table className="mt-3 w-full table-fixed text-[13px]">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="w-[32%] pb-2 font-medium">Sản phẩm</th>
            <th className="w-[18%] pb-2 font-medium">Trạng thái</th>
            <th className="w-[8%] pb-2 text-right font-medium">SL</th>
            <th className="w-[8%] pb-2 text-right font-medium">Đơn</th>
            <th className="w-[17%] pb-2 text-right font-medium">Tiền hàng</th>
            <th className="w-[17%] pb-2 text-right font-medium">Phí ship</th>
          </tr>
        </thead>
      </table>

      {/* Cuộn "gần một trang": mỗi nhát kéo nhảy VISIBLE_ROWS − 1 dòng, chừa đúng một dòng gối đầu để mắt
          bắt lại mạch. Thanh cuộn ẩn khi đứng yên (hiện lúc đang kéo hoặc khi rê chuột vào) — một vạch
          xám đứng im cạnh bảng không nói thêm được gì. */}
      <div
        // Tự ẩn + fade do `scroll-fade` lo (src/utils/scrollFade.ts). Bản cũ ở đây bật/tắt
        // `scrollbar-width` theo state: vừa không mờ dần được, vừa làm bảng co giãn 10px mỗi lượt cuộn.
        className={
          scrolls ? "scroll-fade overflow-y-auto snap-y snap-mandatory overscroll-contain" : ""
        }
        style={scrolls ? { maxHeight } : undefined}
      >
        <table className="w-full table-fixed text-[13px]">
          <tbody ref={bodyRef}>
            {sorted.map((r, i) => (
              <tr
                key={`${r.productId}-${r.status}`}
                className={`border-t border-gray-50 ${i % (VISIBLE_ROWS - 1) === 0 ? "snap-start" : ""}`}
              >
                <td className="w-[32%] py-2 pr-2">
                  <span className="line-clamp-1 text-gray-700">{r.productName}</span>
                </td>
                <td className="w-[18%] py-2 pr-2">
                  <MoneyStateChip state={moneyStateOf(r.status)} />
                </td>
                <td className="w-[8%] py-2 text-right tabular-nums text-gray-600">{r.quantity}</td>
                <td className="w-[8%] py-2 text-right tabular-nums text-gray-600">
                  {r.orderCount}
                </td>
                <td className="w-[17%] py-2 text-right font-medium tabular-nums text-gray-800">
                  {formatVnd(r.value)}
                </td>
                <td
                  className="w-[17%] py-2 text-right tabular-nums text-gray-500"
                  title="Phí ship của đơn, chia theo tỉ trọng tiền hàng của dòng này"
                >
                  {r.shippingFee ? formatVnd(r.shippingFee) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
