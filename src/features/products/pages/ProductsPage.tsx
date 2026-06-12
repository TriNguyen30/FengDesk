import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import { productApi } from "@/features/products/api/product.api";
import type { Category } from "@/features/category/types/category";
import type { Product } from "@/features/products/types/product";
import ProductCard from "@/features/products/components/ProductCard";
import { Filter, SearchX, Loader2 } from "lucide-react";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await getCategoriesRequest();
        if (res.isSuccess) {
          setCategories(res.data.filter((c) => c.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    }
    fetchCategories();
  }, []);

  // Fetch Products based on URL params
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await productApi.getProducts({
          search: search || undefined,
          categoryId: categoryId || undefined,
          pageSize: 20, // Load a bunch initially
        });
        if (res.data.isSuccess) {
          setProducts(res.data.data.items);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [search, categoryId]);

  const handleCategorySelect = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (id) {
      newParams.set("categoryId", id);
    } else {
      newParams.delete("categoryId");
    }
    // Optional: reset page to 1 if we had pagination
    setSearchParams(newParams);
  };

  const handleSearchReset = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams);
  };

  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        
        {/* Sidebar Filter */}
        <aside className="w-full shrink-0 md:w-64">
          <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <Filter className="h-4 w-4" />
              Danh mục sản phẩm
            </h2>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => handleCategorySelect("")}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  !categoryId
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Tất cả sản phẩm
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    categoryId === cat.id
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedCategoryName ? selectedCategoryName : "Tất cả sản phẩm"}
              </h1>
              {search && (
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  Kết quả tìm kiếm cho: <span className="font-semibold text-gray-900">"{search}"</span>
                  <button
                    onClick={handleSearchReset}
                    className="ml-2 text-xs text-primary hover:underline"
                  >
                    Xóa tìm kiếm
                  </button>
                </p>
              )}
            </div>
            {!loading && (
              <p className="text-sm text-gray-500">
                Hiển thị {products.length} sản phẩm
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
              <SearchX className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy sản phẩm</h3>
              <p className="mt-1 text-sm text-gray-500">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
              </p>
              {(search || categoryId) && (
                <button
                  onClick={() => setSearchParams({})}
                  className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
