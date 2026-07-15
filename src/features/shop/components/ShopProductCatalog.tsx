import { Link } from "react-router-dom";
import { Plus, Search, SearchX } from "lucide-react";
import ProductCard, { ProductCardSkeleton } from "@/features/products/components/ProductCard";
import { Product } from "@/features/products/types/product";

interface ShopProductCatalogProps {
  products: Product[];
  loadingProducts: boolean;
  totalCount: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  /** Chỉ owner/co-owner (isShopMember) mới thấy nút thêm sản phẩm. */
  shopId?: string;
  isShopMember?: boolean;
  canAddProduct?: boolean;
}

export function ShopProductCatalog({
  products,
  loadingProducts,
  totalCount,
  searchQuery,
  onSearchQueryChange,
  shopId,
  isShopMember,
  canAddProduct = false,
}: ShopProductCatalogProps) {
  return (
    <section className="lg:col-span-3 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Sản phẩm của Shop</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Hiển thị {products.length} sản phẩm của cửa hàng
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {/* Inner Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <input
              type="text"
              placeholder="Tìm sản phẩm tại shop này..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          {isShopMember &&
            shopId &&
            (canAddProduct ? (
              <Link
                to={`/seller/${shopId}/products/new`}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all cursor-pointer"
              >
                <Plus size={16} />
                Thêm sản phẩm
              </Link>
            ) : (
              <button
                disabled
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-300 px-4 py-2.5 text-sm font-bold text-white shadow-sm cursor-not-allowed opacity-60"
              >
                <Plus size={16} />
                Thêm sản phẩm
              </button>
            ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {loadingProducts ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              editHref={
                isShopMember && shopId ? `/seller/${shopId}/products/${p.id}/edit` : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <SearchX className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-base font-bold text-gray-900">Không tìm thấy sản phẩm nào</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-xs">
            Cửa hàng chưa đăng tải sản phẩm này hoặc bộ lọc từ khóa không phù hợp.
          </p>
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange("")}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark transition-all cursor-pointer"
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>
      )}
    </section>
  );
}
