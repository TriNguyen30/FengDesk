import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/features/cart";
import { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + "đ";
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="group relative flex flex-col rounded-xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary overflow-hidden">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-gray-50 p-3 sm:h-40 sm:p-4 md:h-44">
        <img
          src={product.primaryImageUrl}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3">
        <Link to={`/products/${product.id}`} className="line-clamp-2 min-h-9 text-xs font-medium leading-snug text-gray-800 hover:text-primary sm:min-h-10 sm:text-sm">
          {product.name}
        </Link>

        {/* Prices */}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="truncate text-sm font-bold text-primary sm:text-base">
            {formatPrice(product.minPrice)}
          </span>
        </div>

        {/* Cart */}
        <div className="mt-auto flex items-center justify-end gap-1 pt-1">
          <button
            onClick={() => onAddToCart?.(product)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all duration-200 hover:bg-primary-dark hover:scale-110 active:scale-95"
            aria-label="Thêm vào giỏ hàng"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Best Sellers Section ────────────────────────────────────────────────────

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "24234a84-16bb-44ac-85b8-0fa164a2ed42",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Cầu thạch anh tím",
    isActive: true,
    minPrice: 450000,
    primaryImageUrl: "https://picsum.photos/seed/C%E1%BA%A7u%20th%E1%BA%A1ch%20anh%20t%C3%ADm/600"
  },
  {
    id: "689d7064-805c-4e96-9d74-2e0164651997",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Cây Lưỡi Hổ mini",
    isActive: true,
    minPrice: 150000,
    primaryImageUrl: "https://picsum.photos/seed/C%C3%A2y%20L%C6%B0%E1%BB%A1i%20H%E1%BB%95%20mini/600"
  },
  {
    id: "745325f5-425d-4f02-9795-b64e00ceaa98",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Cây Kim Tiền để bàn",
    isActive: true,
    minPrice: 250000,
    primaryImageUrl: "https://picsum.photos/seed/C%C3%A2y%20Kim%20Ti%E1%BB%81n%20%C4%91%E1%BB%83%20b%C3%A0n/600"
  },
  {
    id: "daa6b71a-435c-4594-973e-458a252fb5f9",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Tượng Tỳ Hưu đồng",
    isActive: true,
    minPrice: 890000,
    primaryImageUrl: "https://picsum.photos/seed/T%C6%B0%E1%BB%A3ng%20T%E1%BB%B3%20H%C6%B0u%20%C4%91%E1%BB%93ng/600"
  },
  {
    id: "fd10352a-07b4-401b-bb04-31a5a84119f0",
    gardenStoreId: "aadafdae-8fcb-48a1-89f3-255c6381248d",
    name: "Đèn muối Himalaya",
    isActive: true,
    minPrice: 320000,
    primaryImageUrl: "https://picsum.photos/seed/%C4%90%C3%A8n%20mu%E1%BB%91i%20Himalaya/600"
  }
];

export function BestSellersSection() {
  const { addItem } = useCart();

  return (
    <section className="mt-6 min-w-0 sm:mt-8">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <h2 className="text-base font-bold text-gray-800 sm:text-lg">Sản phẩm bán chạy</h2>
        <a
          href="#"
          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-dark sm:text-sm"
        >
          Xem tất cả &rsaquo;
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {SAMPLE_PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={(p) =>
              addItem({
                id: p.id,
                name: p.name,
                image: p.primaryImageUrl,
                price: p.minPrice,
              })
            }
          />
        ))}
      </div>
    </section>
  );
}
