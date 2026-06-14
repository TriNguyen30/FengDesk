import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart, AlertCircle, Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { productApi } from "../api/product.api";
import { ProductDetail, ProductItem } from "../types/product";
import { useCart } from "@/features/cart";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productApi.getProductById(id);
        if (response.data.isSuccess && response.data.data) {
          const productData = response.data.data;
          setProduct(productData);
          if (productData.items.length > 0) setSelectedItem(productData.items[0]);
          if (productData.images.length > 0) setActiveImage(productData.images[0].url);
        } else {
          setError(response.data.message || "Không thể tải thông tin sản phẩm");
        }
      } catch {
        setError("Đã xảy ra lỗi khi tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product && selectedItem) {
      addItem({ productItemId: selectedItem.id, quantity: 1 });
      toast.success("Đã thêm vào giỏ hàng");
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6 animate-pulse">
        <div className="mb-4 h-4 w-20 rounded bg-gray-200" />
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <div className="w-full sm:w-[360px] shrink-0">
            <div className="aspect-square w-full rounded-xl bg-gray-200" />
            <div className="mt-2 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-16 rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-6 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-10 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="mt-4 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-24 rounded-lg bg-gray-200" />
              ))}
            </div>
            <div className="mt-4 h-12 w-48 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-base font-medium text-gray-800">{error || "Không tìm thấy sản phẩm"}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const currentPrice = selectedItem?.price ?? product.items[0]?.price ?? 0;
  const outOfStock = selectedItem?.stock === 0;

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary cursor-pointer transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại
      </button>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col sm:flex-row">

          {/* ── Left: Images ─────────────────────────────────────────────── */}
          <div className="w-full shrink-0 p-4 sm:w-[360px] sm:p-6">
            {/* Main image */}
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-50 p-4 shadow-inner">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-300">
                  Không có ảnh
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.url)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-50 transition-all ${activeImage === img.url
                      ? "border-primary"
                      : "border-transparent hover:border-gray-300"
                      }`}
                  >
                    <img src={img.url} alt="thumb" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Info ───────────────────────────────────────────────── */}
          <div className="flex flex-1 flex-col gap-5 border-t border-gray-100 p-4 sm:border-l sm:border-t-0 sm:p-6">

            {/* Categories */}
            {product.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {/* Name + store */}
            <div>
              <h1 className="text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
                {product.name}
              </h1>
              <p className="mt-1.5 text-sm text-gray-400">
                Cửa hàng:{" "}
                <span className="font-medium text-gray-600">{product.storeName}</span>
              </p>
            </div>

            {/* Price */}
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-3xl font-bold text-primary">
                {currentPrice.toLocaleString("vi-VN")}
                <span className="text-lg">đ</span>
              </p>
            </div>

            {/* Variants */}
            {product.items.length > 0 && (
              <div>
                <div className="mb-2.5 flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Phân loại</span>
                  {selectedItem && (
                    <span className="text-xs text-gray-400">
                      Kho: {selectedItem.stock} sản phẩm
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.items.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all focus:outline-none cursor-not-allowed ${isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-gray-50 cursor-pointer"
                          }`}
                      >
                        {item.name}
                        <span className="text-xs opacity-60">
                          {item.price.toLocaleString("vi-VN")}đ
                        </span>
                        {isSelected && (
                          <Check className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-primary p-0.5 text-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="border-t border-dashed border-gray-100 pt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Mô tả sản phẩm</p>
              <p className="text-sm leading-relaxed text-gray-500">{product.description}</p>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Add to cart */}
            <div className="mt-auto pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!selectedItem || outOfStock}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:w-auto cursor-pointer"
              >
                <ShoppingCart className="h-5 w-5" />
                {outOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}