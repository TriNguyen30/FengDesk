import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/app/store";
import { useProductOccupationFit } from "../../hooks/useProductFit";
import type { OccupationFitRow, ProductElementRow } from "../../types/recommendation";
import { ELEMENT_ORDER, elementColor, elementVi, fitToneByPercent, type FitTone } from "./constants";

interface OccupationFitChipsProps {
  productId: string;
  /** Số nghề hợp nhất hiện ra — mặc định 3. */
  limit?: number;
}

/**
 * "Hợp với nghề" trong khối thông tin sản phẩm — mặt A của trục nghề (N3), public, không cần đăng nhập.
 *
 * Chip lấy đúng khuôn chip "Phân loại" ngay phía trên (viền bo, tên + số phụ mờ, dấu check góc phải)
 * để bốn hàng đọc như một bảng thuộc tính. Khác một điểm: nền chip **fill từ trái sang đúng bằng %**
 * và tô theo thang 5 tông xanh lá → vàng → đỏ của radar "Ngũ hành không gian của bạn"
 * ({@link fitToneByPercent}) — cùng một ngôn ngữ màu cho cùng một ý "hợp tới đâu".
 *
 * Con số là `ô · p` (ADR occupation-product-fit-v1.md §4.3) — đúng bằng dòng "Hợp nghề" trong waterfall
 * gợi ý. Đây là tính chất sản phẩm × nghề, không phải "hợp mệnh": chip không được che nhãn khắc mệnh
 * ở panel phía dưới. Nghề của user (nếu đã khai) được đánh dấu check thay vì đổi thứ hạng.
 */
export default function OccupationFitChips({ productId, limit = 3 }: OccupationFitChipsProps) {
  const { t } = useTranslation();
  const { data, status } = useProductOccupationFit(productId);
  const myCode = useAppSelector((s) => s.auth.user?.occupationCode ?? null);

  if (status === "pending") {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-2 h-4 w-24 shrink-0 animate-pulse rounded bg-gray-100" />
        <div className="flex gap-2">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-9 w-32 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }
  if (status === "error" || !data || data.fits.length === 0) return null;

  const top = data.fits.slice(0, limit);

  // Nhãn nằm cùng hàng với chip (cột nhãn cố định) — cùng khuôn với "Phong thủy"/"Thông số" ở trang
  // sản phẩm, để ba hàng thuộc tính không đội chiều cao cột thông tin lên quá cột ảnh.
  return (
    <div className="flex items-start gap-3">
      <span
        className="w-24 shrink-0 pt-2 text-sm font-medium text-gray-700"
        title={t("product_detail.labels.occupation_fit_hint")}
      >
        {t("product_detail.labels.occupation_fit")}
        {data.fits.length > limit && (
          <span className="block text-xs font-normal text-gray-400">+{data.fits.length - limit} nghề khác</span>
        )}
      </span>
      <div className="flex min-w-0 flex-wrap gap-2">
        {top.map((row) => (
          <FitChip
            key={row.code}
            row={row}
            productVector={data.productVector}
            mine={row.code === myCode}
            mineLabel={t("product_detail.labels.occupation_mine")}
          />
        ))}
      </div>
    </div>
  );
}

function FitChip({
  row,
  productVector,
  mine,
  mineLabel,
}: {
  row: OccupationFitRow;
  productVector: ProductElementRow[];
  mine: boolean;
  mineLabel: string;
}) {
  const tone = fitToneByPercent(row.displayPercent);
  const [open, setOpen] = useState(false);
  const popoverId = useId();

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-describedby={open ? popoverId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="relative flex cursor-default items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        style={{ borderColor: tone.chipBorder, color: tone.chipBorder }}
      >
        {/* Fill từ trái = displayPercent; nền mờ cùng tông với viền. */}
        {/* Không overflow-hidden (dấu check thò ra ngoài như chip Phân loại) nên tự bo góc cho phần fill. */}
        <div
          className={`absolute inset-y-0 left-0 rounded-l-lg ${row.displayPercent >= 97 ? "rounded-r-lg" : ""}`}
          style={{ width: `${row.displayPercent}%`, backgroundColor: tone.background }}
        />
        <span className="relative z-10 text-gray-800">{row.nameVi}</span>
        <span className="relative z-10 text-xs tabular-nums opacity-80">{row.displayPercent}%</span>
        {mine && (
          <div
            className="absolute -top-2 -right-2 z-20 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm"
            style={{ backgroundColor: tone.chipBorder }}
            aria-label={mineLabel}
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <FitPopover id={popoverId} row={row} tone={tone} productVector={productVector} mine={mine} mineLabel={mineLabel} />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Popover khi hover/focus — cùng khuôn tooltip của radar "Ngũ hành không gian của bạn" (viền + nền theo
 * tông, tiêu đề có icon, pill nhãn mức, bảng số nhỏ, ghi chú cuối). Bảng đối chiếu **nghề cần** (`ô`,
 * có dấu) với **sản phẩm cấp** (`p`, Σ=1) trên từng hành — người đọc thấy được 83% ra từ đâu chứ không
 * chỉ nhận một con số.
 */
function FitPopover({
  id,
  row,
  tone,
  productVector,
  mine,
  mineLabel,
}: {
  id: string;
  row: OccupationFitRow;
  tone: FitTone;
  productVector: ProductElementRow[];
  mine: boolean;
  mineLabel: string;
}) {
  const need = new Map(row.direction.map((r) => [r.element, r.value]));
  const supply = new Map(productVector.map((r) => [r.element, r.value]));

  // Chỉ những hành có mặt ở một trong hai phía; sắp theo đóng góp ô[e]·p[e] giảm dần để dòng "vì sao
  // được điểm" đứng đầu, dòng "vì sao bị trừ" đứng cuối.
  const rows = ELEMENT_ORDER
    .map((e) => ({ element: e, need: need.get(e) ?? 0, supply: supply.get(e) ?? 0 }))
    .filter((r) => Math.abs(r.need) >= 0.005 || r.supply >= 0.005)
    .sort((a, b) => b.need * b.supply - a.need * a.supply);

  return (
    <motion.div
      id={id}
      role="tooltip"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 top-full z-30 mt-2 w-[260px] max-w-[calc(100vw-2rem)] rounded-xl border p-3 text-xs shadow-lg backdrop-blur-[3px]"
      style={{ background: "rgba(255,255,255,0.96)", borderColor: tone.chipBorder }}
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span
          className="inline-flex items-center justify-center rounded-full p-1 shadow-sm"
          style={{ background: tone.background, color: tone.chipBorder }}
        >
          <Briefcase size={14} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 truncate">{row.nameVi}</span>
        <span className="tabular-nums" style={{ color: tone.chipBorder }}>{row.displayPercent}%</span>
      </div>

      <div
        className="flex items-center justify-between rounded-full px-3 py-1.5 text-[11px] font-medium"
        style={{ background: tone.background, color: tone.chipBorder }}
      >
        <span>{row.tierVi}</span>
        {mine && <span className="opacity-80">{mineLabel}</span>}
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1.5 text-[11px] text-slate-700">
        <span className="text-[10px] uppercase tracking-wide text-slate-400">Hành</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">Nghề cần</span>
        <span className="text-right text-[10px] uppercase tracking-wide text-slate-400">Sản phẩm</span>
        {rows.map((r) => (
          <NeedSupplyRow key={r.element} element={r.element} need={r.need} supply={r.supply} />
        ))}
      </div>

      <p className="mt-2.5 rounded-lg bg-gray-100 px-2 py-1.5 text-[11px] leading-snug text-gray-600">
        {row.reasonVi}
      </p>
      <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
        % = hành nghề cần × hành sản phẩm cấp, quy về 0–100 (50% = trung tính). Không thay cho "hợp bản mệnh".
      </p>
    </motion.div>
  );
}

/** Một hành: chấm màu + tên · thanh có dấu của `ô[e]` quanh trục giữa · % sản phẩm cấp. */
function NeedSupplyRow({ element, need, supply }: { element: string; need: number; supply: number }) {
  const color = elementColor(element);
  const up = need > 0;
  const width = `${Math.min(100, Math.abs(need) * 100)}%`;
  return (
    <>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {elementVi(element)}
      </span>
      <span className="flex items-center gap-1">
        <span className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-l-full bg-gray-100">
          {!up && need !== 0 && <span className="h-1.5 rounded-l-full opacity-50" style={{ width, backgroundColor: color }} />}
        </span>
        <span className="h-2.5 w-px bg-gray-300" />
        <span className="flex h-1.5 flex-1 overflow-hidden rounded-r-full bg-gray-100">
          {up && <span className="h-1.5 rounded-r-full" style={{ width, backgroundColor: color }} />}
        </span>
        <span className={`w-9 shrink-0 text-right tabular-nums ${up ? "text-slate-700" : "text-slate-400"}`}>
          {need > 0 ? "+" : ""}{need.toFixed(2)}
        </span>
      </span>
      <span className={`text-right tabular-nums ${supply > 0 ? "font-medium text-slate-800" : "text-slate-400"}`}>
        {Math.round(supply * 100)}%
      </span>
    </>
  );
}
