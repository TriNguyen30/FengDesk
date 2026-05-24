import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/features/cart";

export interface Product {
    id: number;
    name: string;
    image: string;
    price: number;
    originalPrice: number;
    discount: number;
    rating: number;
    reviewCount: number;
}

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
            {/* Discount Badge */}
            {product.discount > 0 && (
                <span className="absolute top-2 left-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                    -{product.discount}%
                </span>
            )}

            {/* Image */}
            <div className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-gray-50 p-3 sm:h-40 sm:p-4 md:h-44">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3">
                <p className="line-clamp-2 min-h-9 text-xs font-medium leading-snug text-gray-800 sm:min-h-10 sm:text-sm">
                    {product.name}
                </p>

                {/* Prices */}
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <span className="truncate text-sm font-bold text-primary sm:text-base">
                        {formatPrice(product.price)}
                    </span>
                    {product.originalPrice > product.price && (
                        <span className="truncate text-[10px] text-gray-400 line-through sm:text-xs">
                            {formatPrice(product.originalPrice)}
                        </span>
                    )}
                </div>

                {/* Rating + Cart */}
                <div className="mt-auto flex items-center justify-between gap-1 pt-1">
                    <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
                        <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400 sm:h-3.5 sm:w-3.5" />
                        <span className="text-[10px] font-medium text-gray-600 sm:text-xs">
                            {product.rating}
                        </span>
                        <span className="hidden text-[10px] text-gray-400 sm:inline sm:text-xs">
                            ({product.reviewCount})
                        </span>
                    </div>

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
        id: 1,
        name: "Cây A",
        image: "https://phuongtrunggreen.com/resource/gellary/images/san-pham/trau-ba-cot/Trau-ba-leo-cot-chau-su-trang.jpg",
        price: 26990000,
        originalPrice: 33990000,
        discount: 20,
        rating: 4.9,
        reviewCount: 256,
    },
    {
        id: 2,
        name: "Cây B",
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/macbook-air-m2-2022.png",
        price: 24990000,
        originalPrice: 29990000,
        discount: 15,
        rating: 4.8,
        reviewCount: 186,
    },
    {
        id: 3,
        name: "Cây C",
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-wh-1000xm5-1.png",
        price: 6990000,
        originalPrice: 9390000,
        discount: 25,
        rating: 4.9,
        reviewCount: 201,
    },
    {
        id: 4,
        name: "Cây D",
        image: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/p/apple-watch-s9-1.png",
        price: 8490000,
        originalPrice: 10490000,
        discount: 20,
        rating: 4.8,
        reviewCount: 176,
    },
    {
        id: 5,
        name: "Cây E",
        image: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/product_image_1.jpg",
        price: 2190000,
        originalPrice: 3100000,
        discount: 30,
        rating: 4.7,
        reviewCount: 132,
    },
    {
        id: 6,
        name: "Cây F",
        image: "https://down-vn.img.susercontent.com/file/sg-11134201-7rblz-lnekv2mxp3ab14",
        price: 599000,
        originalPrice: 799000,
        discount: 25,
        rating: 4.6,
        reviewCount: 99,
    },
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
                                image: p.image,
                                price: p.price,
                            })
                        }
                    />
                ))}
            </div>
        </section>
    );
}