import { useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import {
  fitToneByPercent,
  scorePercent,
} from "@/features/recommendation/components/element-vector/constants";
import type { RecommendationItem } from "@/features/recommendation/types/recommendation";
import { useAddProductsToCart } from "@/features/cart/hooks/useAddProductsToCart";
import { formatVnd } from "@/features/orders/utils/orderUtils";
import { useProductHoverIntent } from "../context/WorkspaceHoverContext";
import type { RecommendationSelection } from "../hooks/useRecommendationSelection";
import type { WorkspaceRecommendations } from "../hooks/useWorkspaceRecommendations";

interface WorkspaceRecommendationPickerProps {
  /** Chỉ render khi `state` là loading/ready — rỗng thì trang dùng {@link RecommendationEmptyNotice}. */
  recommendations: WorkspaceRecommendations;
  selection: RecommendationSelection;
}

/**
 * Hàng "Đề xuất cho phòng này" full-width dưới khối ngũ hành: thẻ xếp NGANG, cuộn ngang. Bấm thẻ = chọn
 * (sáng viền + hiện ô số lượng), không dùng checkbox. Hover xem trước trên radar qua context như panel
 * sidebar; đã chọn món thì radar xem trước gộp cả nhóm (xem WorkspaceElementSection).
 */
export default function WorkspaceRecommendationPicker({
  recommendations,
  selection,
}: WorkspaceRecommendationPickerProps) {
  const { hovered, beginHover, endHover } = useProductHoverIntent();
  const { items, note, state } = recommendations;
  const rowRef = useRef<HTMLUListElement>(null);
  // Cuộn khoảng 3 thẻ mỗi lần bấm — thẻ rộng 11rem + gap.
  const scrollRow = (direction: 1 | -1) =>
    rowRef.current?.scrollBy({ left: direction * 3 * 188, behavior: "smooth" });

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-[#111827]">
          <Sparkles size={15} className="text-primary" />
          Đề xuất cho phòng này
          {items.length > 0 && (
            <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-bold tabular-nums text-gray-600">
              {items.length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {state === "ready" && items.length > 3 && (
            <>
              <ScrollButton direction={-1} onClick={() => scrollRow(-1)} />
              <ScrollButton direction={1} onClick={() => scrollRow(1)} />
            </>
          )}
        </div>
      </div>

      {note && <p className="text-[11px] text-amber-700">{note}</p>}

      {state === "loading" ? (
        <RowSkeleton />
      ) : (
        <div className="-mx-1">
          <ul
            ref={rowRef}
            className="custom-scrollbar flex snap-x gap-3 overflow-x-auto scroll-smooth px-1 pb-2 pt-1"
          >
            {items.map((item) => (
              <RecommendationCard
                key={item.productId}
                item={item}
                quantity={selection.selection.get(item.productId)?.quantity ?? 0}
                maxQuantity={selection.maxQuantity}
                previewing={hovered?.productId === item.productId}
                onToggle={() => selection.toggle(item)}
                onQuantityChange={(q) => selection.setQuantity(item.productId, q)}
                onEnter={() => beginHover({ productId: item.productId, label: item.productName })}
                onLeave={endHover}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface RecommendationCardProps {
  item: RecommendationItem;
  /** 0 = chưa chọn. */
  quantity: number;
  maxQuantity: number;
  previewing: boolean;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  onEnter: () => void;
  onLeave: () => void;
}

function RecommendationCard({
  item,
  quantity,
  maxQuantity,
  previewing,
  onToggle,
  onQuantityChange,
  onEnter,
  onLeave,
}: RecommendationCardProps) {
  const selected = quantity > 0;
  const percent = scorePercent(item.score);
  const tone = fitToneByPercent(percent);

  return (
    <li
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className={`group relative flex w-44 shrink-0 snap-start cursor-pointer flex-col rounded-xl border bg-white p-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/25"
          : previewing
            ? "border-primary/40 shadow-sm"
            : "border-gray-200 hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      <div className="relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className={`aspect-square w-full rounded-lg object-cover transition ${selected ? "" : "group-hover:brightness-95"}`}
          />
        ) : (
          <div className="aspect-square w-full rounded-lg bg-gray-100" />
        )}
        <span
          // Nền ĐẶC theo màu mức phù hợp + chữ trắng: nằm đè lên ảnh sản phẩm nên nền trong (18%) như
          // chip thường sẽ chìm mất trên ảnh sáng.
          className="absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-md ring-1 ring-white/60"
          style={{ backgroundColor: tone.chipBorder }}
          title={`${tone.label} — ${percent}% phù hợp với phòng này`}
        >
          {percent}%
        </span>
        <span
          className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 shadow-sm transition ${
            selected
              ? "border-primary bg-primary text-white"
              : "border-white bg-white/70 text-transparent group-hover:text-gray-300"
          }`}
          aria-hidden
        >
          <Check size={12} strokeWidth={3} />
        </span>
      </div>

      <div className="mt-2 flex items-start gap-1">
        <p
          className="line-clamp-2 min-h-[2.2rem] flex-1 text-[13px] font-medium leading-snug text-gray-800"
          title={
            item.matchFacts[0] ? `${item.productName} — ${item.matchFacts[0]}` : item.productName
          }
        >
          {item.productName}
        </p>
        <Link
          to={`/products/${item.productId}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="mt-0.5 shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-primary"
          title="Xem chi tiết sản phẩm"
        >
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* Cùng chiều cao ở cả hai trạng thái — chọn/bỏ chọn không làm hàng thẻ nhảy. */}
      <div className="mt-1.5 flex h-7 items-center justify-between gap-2">
        <span className="truncate text-[12px] font-semibold text-gray-700">
          {item.price != null ? formatVnd(item.price) : "Liên hệ"}
        </span>
        {selected && (
          <QuantityStepper value={quantity} max={maxQuantity} onChange={onQuantityChange} />
        )}
      </div>
    </li>
  );
}

function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    // Bấm trong stepper không được lan lên thẻ (sẽ bỏ chọn cả món).
    <div
      className="flex shrink-0 items-center rounded-md border border-primary/30 bg-white"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="flex h-6 w-6 items-center justify-center text-gray-500 hover:text-primary cursor-pointer"
        title={value <= 1 ? "Bỏ chọn" : "Giảm"}
      >
        {value <= 1 ? <X size={12} /> : <Minus size={12} />}
      </button>
      <span className="w-6 text-center text-xs font-bold tabular-nums text-gray-800">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="flex h-6 w-6 items-center justify-center text-gray-500 hover:text-primary disabled:opacity-40 cursor-pointer"
        title="Tăng"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

// ── Tóm tắt lựa chọn (dải ngang dưới hàng đề xuất) ───────────

interface RecommendationSelectionSummaryProps {
  selection: RecommendationSelection;
}

/**
 * Dải dưới hàng đề xuất: các món đã chọn + tạm tính, "Thêm vào giỏ" / "Mua ngay". Mua ngay = thêm vào giỏ rồi
 * sang /checkout với đúng các dòng vừa thêm (cùng cách ProductDetailPage làm cho 1 món).
 */
export function RecommendationSelectionSummary({ selection }: RecommendationSelectionSummaryProps) {
  const navigate = useNavigate();
  const { addProducts, pending } = useAddProductsToCart();
  const { lines, totalQuantity, totalPrice, hasUnpricedItem } = selection;

  const submit = async (goToCheckout: boolean) => {
    const { cartItemIds, skipped } = await addProducts(
      lines.map((l) => ({
        productId: l.item.productId,
        productName: l.item.productName,
        quantity: l.quantity,
      })),
    );
    if (skipped.length > 0) toast.error(`Không thêm được: ${skipped.join(", ")}`);
    if (cartItemIds.length === 0) return;
    selection.clear();
    if (goToCheckout) {
      navigate("/checkout", { state: { selectedItemIds: cartItemIds } });
    } else {
      toast.success(`Đã thêm ${cartItemIds.length} sản phẩm vào giỏ hàng`);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-600">
            Đã chọn <strong className="text-gray-900">{lines.length}</strong> sản phẩm
            {totalQuantity !== lines.length && <> · {totalQuantity} món</>}
          </p>
          <button
            type="button"
            onClick={selection.clear}
            disabled={pending}
            className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer disabled:opacity-50"
          >
            Bỏ chọn tất cả
          </button>
        </div>
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {lines.map((l) => (
            <li
              key={l.item.productId}
              className="max-w-[12rem] truncate rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary-dark"
              title={l.item.productName}
            >
              {l.quantity > 1 && <strong>{l.quantity}× </strong>}
              {l.item.productName}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 pt-2 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <div className="text-right">
          <p className="text-[11px] text-gray-500">{hasUnpricedItem ? "Tạm tính*" : "Tạm tính"}</p>
          <p className="text-base font-bold tabular-nums text-gray-900">{formatVnd(totalPrice)}</p>
          {hasUnpricedItem && (
            <p className="text-[10px] text-gray-400">*Chưa gồm món chưa có giá</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-50 cursor-pointer"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
            Thêm vào giỏ
          </button>
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
}

function ScrollButton({ direction, onClick }: { direction: 1 | -1; onClick: () => void }) {
  const Icon = direction === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-primary/40 hover:text-primary cursor-pointer"
      title={direction === 1 ? "Xem tiếp" : "Quay lại"}
    >
      <Icon size={15} />
    </button>
  );
}

function RowSkeleton() {
  return (
    <ul className="flex gap-3 overflow-hidden pb-2 pt-1">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <li key={i} className="h-64 w-44 shrink-0 animate-pulse rounded-xl bg-gray-50" />
      ))}
    </ul>
  );
}

/**
 * Không có đề xuất (422 / lỗi / rỗng): một dải gọn phía trên khối ngũ hành thay cho cột lưới trống —
 * radar trở về bố cục hai cột cũ nên không còn nửa khung bỏ không.
 */
export function RecommendationEmptyNotice({ error }: { error: unknown }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3">
      <Sparkles size={15} className="shrink-0 text-gray-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-700">Chưa có đề xuất cho phòng này</p>
        <p className="text-[11px] leading-snug text-gray-500">{recommendationErrorText(error)}</p>
      </div>
      <Link
        to="/products"
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
      >
        <Store size={13} />
        Xem cửa hàng
      </Link>
    </div>
  );
}

/** 422 từ BE (chưa sản phẩm nào gắn thuộc tính / không món nào hợp) mang message đọc được — hiện nguyên. */
function recommendationErrorText(error: unknown): string {
  const message = (error as { response?: { data?: { message?: string } } } | null)?.response?.data
    ?.message;
  if (message) return message;
  return error
    ? "Chưa lấy được danh sách đề xuất cho phòng này."
    : "Chưa có sản phẩm nào phù hợp với phòng này.";
}
