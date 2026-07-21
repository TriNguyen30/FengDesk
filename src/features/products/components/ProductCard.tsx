import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, Pencil, ShoppingCart } from "lucide-react";
import { useProductList } from "../hooks/useProducts";
import { Product } from "../types/product";
import { useCart } from "@/features/cart";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ELEMENT_LABELS: Record<string, string> = {
  Kim: "Kim",
  Moc: "Mộc",
  Thuy: "Thủy",
  Hoa: "Hỏa",
  Tho: "Thổ",
};

const ELEMENT_COLORS: Record<string, string> = {
  Kim: "bg-slate-500",
  Moc: "bg-green-600",
  Thuy: "bg-blue-500",
  Hoa: "bg-red-500",
  Tho: "bg-amber-600",
};

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + "đ";
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  soldCount?: number;
  /** Chỉ truyền khi người xem là chủ/co-owner của shop — hiện nút sửa nhanh ở góc thẻ. */
  editHref?: string;
}

export default function ProductCard({ product, soldCount, editHref }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.items || product.items.length === 0) {
      toast.error("Sản phẩm chưa có thông tin kho.");
      return;
    }

    try {
      await addItem({ productItemId: product.items[0].id, quantity: 1 });
      toast.success("Đã thêm vào giỏ hàng");
    } catch (err: any) {
      toast.error(err.message || "Không thể thêm vào giỏ hàng");
    }
  };

  const elementLabel = product.primaryElement
    ? ELEMENT_LABELS[product.primaryElement] || product.primaryElement
    : null;
  const elementColor = product.primaryElement
    ? ELEMENT_COLORS[product.primaryElement] || "bg-primary"
    : "";

  return (
    <div className="group relative flex flex-col rounded-md bg-white border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Feng Shui Badge */}
      {elementLabel && (
        <div
          className={`absolute top-2 left-2 z-10 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${elementColor}`}
        >
          Mệnh {elementLabel}
        </div>
      )}

      {/* Nút sửa nhanh (owner/co-owner) — sibling đè lên trên, không lồng trong Link chính bên dưới */}
      {editHref && (
        <Link
          to={editHref}
          title="Sửa sản phẩm"
          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm hover:bg-primary hover:text-white transition-colors"
        >
          <Pencil size={12} />
        </Link>
      )}

      <Link to={`/products/${product.id}`} className="flex flex-col">
        {/* Square image */}
        <div className="aspect-square w-full overflow-hidden bg-gray-50">
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-3">
          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-gray-800 min-h-[38px] group-hover:text-primary transition-colors">
            {product.name}
          </p>

          <div className="mt-2 mb-3">
            <p className="text-base font-bold text-primary">{formatPrice(product.minPrice)}</p>
            {soldCount !== undefined && (
              <p className="text-[11px] text-gray-400 mt-0.5">Đã bán {soldCount}</p>
            )}
          </div>

          <div className="mt-auto border-t border-gray-100 pt-3 flex items-center justify-between">
            <button
              className="flex items-center group/btn cursor-pointer transition-opacity hover:opacity-80"
              onClick={handleAddToCart}
            >
              <div className="bg-primary text-white rounded-full p-1.5 shadow-sm transition-transform active:scale-95 relative z-10">
                <ShoppingCart size={14} strokeWidth={2.5} />
              </div>
              <div className="text-[10px] font-bold leading-[1.1] text-primary text-left uppercase overflow-hidden whitespace-nowrap transition-all duration-300 max-w-0 opacity-0 -translate-x-3 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:translate-x-0 group-hover:ml-1.5">
                Thêm vào giỏ
              </div>
            </button>
            <span className="bg-gray-100/80 text-primary text-[10px] px-2 py-1 rounded shadow-sm font-medium whitespace-nowrap">
              Còn hàng
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col rounded-md bg-white border border-gray-100 overflow-hidden animate-pulse">
      {/* Skeleton Badge */}
      <div className="absolute top-2 left-2 z-10 h-4 w-8 rounded-sm bg-gray-200" />

      {/* Square image */}
      <div className="aspect-square w-full bg-gray-100" />
      {/* Info */}
      <div className="flex flex-col gap-1.5 p-2">
        {/* Name */}
        <div className="flex flex-col gap-1 min-h-[33px] justify-center">
          <div className="h-3 w-11/12 rounded bg-gray-200" />
          <div className="h-3 w-8/12 rounded bg-gray-200" />
        </div>
        {/* Price */}
        <div className="h-4 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function useProducts(pageSize: number) {
  return useProductList({ pageSize });
}

// ─── BestSellersSection ───────────────────────────────────────────────────────

export function BestSellersSection() {
  const { products, loading } = useProducts(12);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || products.length === 0) return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let intervalId: NodeJS.Timeout;
    let isHovered = false;

    const startAutoPlay = () => {
      intervalId = setInterval(() => {
        if (!isHovered && scrollContainer) {
          const firstChild = scrollContainer.children[0] as HTMLElement;
          const childWidth = firstChild?.offsetWidth || 0;
          const gap = 12;
          const scrollAmount = childWidth + gap;

          if (
            scrollContainer.scrollLeft + scrollContainer.clientWidth >=
            scrollContainer.scrollWidth - 10
          ) {
            scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            scrollContainer.scrollBy({ left: scrollAmount, behavior: "smooth" });
          }
        }
      }, 3000);
    };

    startAutoPlay();

    const handleMouseEnter = () => (isHovered = true);
    const handleMouseLeave = () => (isHovered = false);

    scrollContainer.addEventListener("mouseenter", handleMouseEnter);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);
    scrollContainer.addEventListener("touchstart", handleMouseEnter);
    scrollContainer.addEventListener("touchend", handleMouseLeave);

    return () => {
      clearInterval(intervalId);
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
      scrollContainer.removeEventListener("touchstart", handleMouseEnter);
      scrollContainer.removeEventListener("touchend", handleMouseLeave);
    };
  }, [loading, products]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const firstChild = scrollRef.current.children[0] as HTMLElement;
      const scrollAmount = (firstChild?.offsetWidth || 0) + 12;
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const firstChild = scrollRef.current.children[0] as HTMLElement;
      const scrollAmount = (firstChild?.offsetWidth || 0) + 12;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 min-w-0 overflow-hidden rounded-xl bg-white p-3 shadow-sm sm:mt-8 sm:p-4">
      {/* Header */}
      <div className="-mx-3 -mt-3 mb-4 flex items-center justify-between sm:-mx-4 sm:-mt-4">
        <div className="relative inline-block">
          {/* Dark teal fold phía sau */}
          <div
            className="absolute right-0 h-full w-12 sm:w-12 bg-teal-900"
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
          />

          {/* Badge chính */}
          <h2
            className="relative z-10 rounded-tl-xl bg-primary
              px-4 py-2 pr-12 text-sm font-bold uppercase tracking-wide text-white
              sm:px-4 sm:py-2 sm:pr-16 sm:text-xl"
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 28px) 0, 100% 100%, 0 100%)",
            }}
          >
            Sản phẩm bán chạy
          </h2>
        </div>

        <Link
          to="/products"
          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-dark sm:text-sm cursor-pointer mr-5"
        >
          Xem tất cả &rsaquo;
        </Link>
      </div>

      {/* Product list */}
      <div className="relative group/slider">
        {loading ? (
          <div
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1
              [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-[calc(50%-0.375rem)] shrink-0 snap-start
                  sm:w-[calc(33.333%-0.5rem)]
                  md:w-[calc(25%-0.5625rem)]
                  lg:w-[calc(20%-0.6rem)]"
              >
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1
                [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="w-[calc(50%-0.375rem)] shrink-0 snap-start
                    sm:w-[calc(33.333%-0.5rem)]
                    md:w-[calc(25%-0.5625rem)]
                    lg:w-[calc(20%-0.6rem)]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {products.length > 0 && (
              <>
                <button
                  onClick={scrollLeft}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-100 text-gray-600 opacity-0 transition-opacity hover:bg-gray-50 group-hover/slider:opacity-100 md:flex cursor-pointer"
                  aria-label="Cuộn trái"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={scrollRight}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-100 text-gray-600 opacity-0 transition-opacity hover:bg-gray-50 group-hover/slider:opacity-100 md:flex cursor-pointer"
                  aria-label="Cuộn phải"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─── YouMightAlsoLikeSection ──────────────────────────────────────────────────

export function YouMightAlsoLikeSection() {
  const { products, loading } = useProducts(5);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 w-full overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
        <h2 className="text-lg font-bold text-gray-900">Có thể bạn cũng thích</h2>
        <Link
          to="/products"
          className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary-dark cursor-pointer"
        >
          Xem tất cả &rsaquo;
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
