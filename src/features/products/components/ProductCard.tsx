import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useProductList } from "../hooks/useProducts";
import { Product } from "../types/product";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + "đ";
} 

// ─── ProductCard ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  soldCount?: number;
}

export default function ProductCard({ product, soldCount }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col rounded-md bg-white border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      {/* Square image */}
      <div className="aspect-square w-full overflow-hidden bg-gray-50">
        <img
          src={product.primaryImageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-2">
        <p className="line-clamp-2 text-xs leading-snug text-gray-800 min-h-[33px]">
          {product.name}
        </p>

        <p className="text-sm font-medium text-[#ee4d2d]">{formatPrice(product.minPrice)}</p>

        {soldCount !== undefined && <p className="text-[11px] text-gray-400">Đã bán {soldCount}</p>}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-md bg-white border border-gray-100 overflow-hidden animate-pulse">
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
  const { products, loading } = useProducts(6);

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 min-w-0 sm:mt-8">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <h2 className="text-base font-bold text-gray-800 sm:text-lg">Sản phẩm bán chạy</h2>
        <Link
          to="/products"
          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-dark sm:text-sm cursor-pointer"
        >
          Xem tất cả &rsaquo;
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
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
    <section className="mt-8 min-w-0 sm:mt-12 w-full">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
        <h2 className="text-xm font-medium text-gray-500 sm:text-xm">Có thể bạn cũng thích</h2>
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
