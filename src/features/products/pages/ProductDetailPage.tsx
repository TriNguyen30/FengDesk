import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Check, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productApi.getProductById(id);
        if (response.data.isSuccess && response.data.data) {
          const productData = response.data.data;
          setProduct(productData);
          if (productData.items.length > 0) {
            setSelectedItem(productData.items[0]);
          }
        } else {
          setError(response.data.message || "Failed to load product details");
        }
      } catch (err) {
        setError("An error occurred while fetching product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product && selectedItem) {
      addItem({
        id: selectedItem.id, // using the specific variant ID
        name: `${product.name} - ${selectedItem.name}`,
        image: product.images.length > 0 ? product.images[0].url : "",
        price: selectedItem.price,
      });
      alert("Đã thêm vào giỏ hàng");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium text-gray-800">{error || "Product not found"}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  const primaryImage = product.images.length > 0 ? product.images[0].url : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image Section */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-50 p-6 shadow-inner">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>
          
          {/* Thumbnails if multiple images exist */}
          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-transparent bg-gray-50 hover:border-primary focus:border-primary focus:outline-none"
                >
                  <img src={img.url} alt="thumbnail" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex flex-col">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {product.categories.map((cat) => (
              <span key={cat.id} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {cat.name}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Cửa hàng: <span className="text-gray-700">{product.storeName}</span>
          </p>

          <div className="mt-6 flex items-end gap-4">
            <p className="text-3xl font-bold text-primary">
              {selectedItem ? selectedItem.price.toLocaleString("vi-VN") : product.items[0]?.price.toLocaleString("vi-VN")}
              <span className="text-lg">đ</span>
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900">Mô tả sản phẩm</h3>
            <div className="prose prose-sm mt-2 text-gray-600">
              <p>{product.description}</p>
            </div>
          </div>

          {product.items.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Phân loại</h3>
                {selectedItem && (
                  <span className="text-sm text-gray-500">Kho: {selectedItem.stock}</span>
                )}
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {product.items.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`relative flex flex-col items-center justify-center rounded-xl border p-3 text-sm font-medium transition-all focus:outline-none ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span>{item.name}</span>
                      <span className="mt-1 text-xs text-gray-500">{item.price.toLocaleString("vi-VN")}đ</span>
                      {isSelected && (
                        <Check className="absolute top-1.5 right-1.5 h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-10 flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={!selectedItem || selectedItem.stock === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-primary-dark hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              <ShoppingCart className="h-5 w-5" />
              {selectedItem?.stock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </button>
          </div>

          {product.tags.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900">Tags</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag.id} className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
