import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import type { Category } from "@/features/category/types/category";
import ProductCard, { ProductCardSkeleton } from "@/features/products/components/ProductCard";
import { useProductList } from "@/features/products/hooks/useProducts";
import type { GetProductsParams } from "@/features/products/types/product";
import { SearchX, List, ChevronRight, Filter, Banknote } from "lucide-react";
import FeatureBar from "@/components/ui/FeatureBar";

const FS_ELEMENTS = [
  { code: "Kim", label: "Kim (Kim loại)" },
  { code: "Moc", label: "Mộc (Cây cối)" },
  { code: "Thuy", label: "Thủy (Nước)" },
  { code: "Hoa", label: "Hỏa (Lửa)" },
  { code: "Tho", label: "Thổ (Đất)" },
];

const PRICE_RANGES = [
  { id: "0-100000", label: "Dưới 100.000đ", min: 0, max: 100000 },
  { id: "100000-300000", label: "100.000đ - 300.000đ", min: 100000, max: 300000 },
  { id: "300000-500000", label: "300.000đ - 500.000đ", min: 300000, max: 500000 },
  { id: "500000-1000000", label: "500.000đ - 1.000.000đ", min: 500000, max: 1000000 },
  { id: "1000000-999999999", label: "Trên 1.000.000đ", min: 1000000, max: 999999999 },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const sort = searchParams.get("sort") || "default";
  const element = searchParams.get("element") || "";
  const priceRangeId = searchParams.get("price") || "";

  const handlePriceSelect = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (id) {
      newParams.set("price", id);
    } else {
      newParams.delete("price");
    }
    setSearchParams(newParams);
  };

  const handleElementSelect = (code: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (code) {
      newParams.set("element", code);
    } else {
      newParams.delete("element");
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value === "default") {
      newParams.delete("sort");
    } else {
      newParams.set("sort", e.target.value);
    }
    setSearchParams(newParams);
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Filter hành đẩy xuống BE (?element=...) — lọc trên TOÀN BỘ catalog (khớp cả hành
  // chính lẫn hành phụ qua product_elements), thay vì lọc client-side 1 trang như trước.
  const { products, loading } = useProductList({
    search: search || undefined,
    categoryId: categoryId || undefined,
    element: (element || undefined) as GetProductsParams["element"],
    pageSize: 20,
  });

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    let arr = [...products];

    if (priceRangeId) {
      const range = PRICE_RANGES.find(r => r.id === priceRangeId);
      if (range) {
        arr = arr.filter(p => p.minPrice >= range.min && p.minPrice <= range.max);
      }
    }

    switch (sort) {
      case "name-asc":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case "price-asc":
        return arr.sort((a, b) => a.minPrice - b.minPrice);
      case "price-desc":
        return arr.sort((a, b) => b.minPrice - a.minPrice);
      default:
        return arr;
    }
  }, [products, sort, priceRangeId]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await getCategoriesRequest();
        if (res.isSuccess) {
          setCategories(res.data.filter((c) => c.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [search, categoryId, element, priceRangeId]);

  const handleCategorySelect = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (id) {
      newParams.set("categoryId", id);
    } else {
      newParams.delete("categoryId");
    }
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
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link to="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-gray-900">Sản phẩm</span>
      </nav>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* Sidebar Filter */}
        <aside className="w-full shrink-0 md:w-64">
          <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-medium text-gray-900">
              <List className="h-4 w-4" />
              Danh Mục
            </h2>
            <div className="flex flex-col gap-3 mt-2">
              {loadingCategories ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-5 w-3/4 rounded bg-gray-100" />
                  ))}
                </div>
              ) : (
                <>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={!categoryId}
                      onChange={() => handleCategorySelect("")}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span
                      className={`text-sm font-medium transition-colors ${
                        !categoryId ? "text-primary" : "text-gray-600 group-hover:text-gray-900"
                      }`}
                    >
                      Tất cả sản phẩm
                    </span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={categoryId === cat.id}
                        onChange={() => handleCategorySelect(categoryId === cat.id ? "" : cat.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span
                        className={`text-sm font-medium transition-colors ${
                          categoryId === cat.id
                            ? "text-primary"
                            : "text-gray-600 group-hover:text-gray-900"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>

            <div className="mt-8">
              <h2 className="mb-4 flex items-center gap-2 font-medium text-gray-900">
                <Banknote className="h-4 w-4" />
                Mức Giá
              </h2>
              <div className="flex flex-col gap-3 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!priceRangeId}
                    onChange={() => handlePriceSelect("")}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span
                    className={`text-sm font-medium transition-colors ${
                      !priceRangeId ? "text-primary" : "text-gray-600 group-hover:text-gray-900"
                    }`}
                  >
                    Tất cả mức giá
                  </span>
                </label>
                {PRICE_RANGES.map((pr) => (
                  <label key={pr.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={priceRangeId === pr.id}
                      onChange={() => handlePriceSelect(priceRangeId === pr.id ? "" : pr.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span
                      className={`text-sm font-medium transition-colors ${
                        priceRangeId === pr.id
                          ? "text-primary"
                          : "text-gray-600 group-hover:text-gray-900"
                      }`}
                    >
                      {pr.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-4 flex items-center gap-2 font-medium text-gray-900">
                <Filter className="h-4 w-4" />
                Mệnh (Hành)
              </h2>
              <div className="flex flex-col gap-3 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!element}
                    onChange={() => handleElementSelect("")}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span
                    className={`text-sm font-medium transition-colors ${
                      !element ? "text-primary" : "text-gray-600 group-hover:text-gray-900"
                    }`}
                  >
                    Tất cả các mệnh
                  </span>
                </label>
                {FS_ELEMENTS.map((el) => (
                  <label key={el.code} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={element === el.code}
                      onChange={() => handleElementSelect(element === el.code ? "" : el.code)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <span
                      className={`text-sm font-medium transition-colors ${
                        element === el.code
                          ? "text-primary"
                          : "text-gray-600 group-hover:text-gray-900"
                      }`}
                    >
                      {el.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              {loadingCategories ? (
                <div className="h-6 w-48 rounded bg-gray-200 animate-pulse" />
              ) : (
                <h1 className="text-lg font-medium text-gray-900">
                  {selectedCategoryName ? selectedCategoryName : "Tất cả sản phẩm"}{" "}
                  <span className="text-sm text-gray-600">({sortedProducts.length})</span>
                </h1>
              )}
              {search && (
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  Kết quả tìm kiếm cho:{" "}
                  <span className="font-semibold text-gray-900">"{search}"</span>
                  <button
                    onClick={handleSearchReset}
                    className="ml-2 text-xs text-primary hover:underline cursor-pointer"
                  >
                    Xóa tìm kiếm
                  </button>
                </p>
              )}
            </div>
            {!loading && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sắp xếp theo:</span>
                  <select
                    value={sort}
                    onChange={handleSortChange}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="default">Mặc định</option>
                    <option value="name-asc">Tên A-Z</option>
                    <option value="name-desc">Tên Z-A</option>
                    <option value="price-asc">Giá tăng dần</option>
                    <option value="price-desc">Giá giảm dần</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 lg:gap-6">
              {sortedProducts.map((product) => (
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
              {(search || categoryId || element) && (
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
      <FeatureBar />
    </div>
  );
}
