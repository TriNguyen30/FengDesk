import { Link } from "react-router-dom";
import { Product } from "../types/product";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return "₫" + price.toLocaleString("vi-VN");
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

        <p className="text-sm font-medium text-[#ee4d2d]">
          {formatPrice(product.minPrice)}
        </p>

        {soldCount !== undefined && (
          <p className="text-[11px] text-gray-400">Đã bán {soldCount}</p>
        )}
      </div>
    </Link>
  );
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "24234a84-16bb-44ac-85b8-0fa164a2ed42",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Cầu thạch anh tím",
    isActive: true,
    minPrice: 450000,
    primaryImageUrl:
      "https://picsum.photos/seed/C%E1%BA%A7u%20th%E1%BA%A1ch%20anh%20t%C3%ADm/600",
  },
  {
    id: "689d7064-805c-4e96-9d74-2e0164651997",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Cây Lưỡi Hổ mini",
    isActive: true,
    minPrice: 150000,
    primaryImageUrl:
      "https://picsum.photos/seed/C%C3%A2y%20L%C6%B0%E1%BB%A1i%20H%E1%BB%95%20mini/600",
  },
  {
    id: "745325f5-425d-4f02-9795-b64e00ceaa98",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Cây Kim Tiền để bàn",
    isActive: true,
    minPrice: 250000,
    primaryImageUrl:
      "https://picsum.photos/seed/C%C3%A2y%20Kim%20Ti%E1%BB%81n%20%C4%91%E1%BB%83%20b%C3%A0n/600",
  },
  {
    id: "daa6b71a-435c-4594-973e-458a252fb5f9",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Tượng Tỳ Hưu đồng",
    isActive: true,
    minPrice: 890000,
    primaryImageUrl:
      "https://picsum.photos/seed/T%C6%B0%E1%BB%A3ng%20T%E1%BB%B3%20H%C6%B0u%20%C4%91%E1%BB%93ng/600",
  },
  {
    id: "fd10352a-07b4-401b-bb04-31a5a84119f0",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Đèn muối Himalaya",
    isActive: true,
    minPrice: 320000,
    primaryImageUrl:
      "https://picsum.photos/seed/%C4%90%C3%A8n%20mu%E1%BB%91i%20Himalaya/600",
  },
];

// ─── BestSellersSection ───────────────────────────────────────────────────────

export function BestSellersSection() {
  return (
    <section className="mt-6 min-w-0 sm:mt-8">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <h2 className="text-base font-bold text-gray-800 sm:text-lg">
          Sản phẩm bán chạy
        </h2>
        <a
          href="/products"
          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-dark sm:text-sm cursor-pointer"
        >
          Xem tất cả &rsaquo;
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {SAMPLE_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

// ─── YouMightAlsoLikeSection ──────────────────────────────────────────────────

export function YouMightAlsoLikeSection() {
  return (
    <section className="mt-8 min-w-0 sm:mt-12 w-full">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
        <h2 className="text-xm font-medium text-gray-500 sm:text-xm">
          Có thể bạn cũng thích
        </h2>
        <Link
          to="/products"
          className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary-dark cursor-pointer"
        >
          Xem tất cả &rsaquo;
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {SAMPLE_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}