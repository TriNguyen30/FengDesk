import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import type { Category } from "@/features/category/types/category";

export default function PopularCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

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

  return (
    <section className="mt-6 min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <h2 className="text-base font-bold text-gray-800 sm:text-lg">Danh mục nổi bật</h2>
        <Link
          to="/products"
          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-dark sm:text-sm"
        >
          Xem tất cả &rsaquo;
        </Link>
      </div>

      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:p-4">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?categoryId=${cat.id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-full border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
