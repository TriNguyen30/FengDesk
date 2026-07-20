import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import type { Category } from "@/features/category/types/category";
import dragonStatueIcon from "@/assets/icon/DragonStatue.png";
import lampIcon from "@/assets/icon/Lamp.png";
import plantPotIcon from "@/assets/icon/PlantPot.png";
import crystalIcon from "@/assets/icon/Crystal.png";
import agarwoodIcon from "@/assets/icon/TramHuong.png";

const CATEGORY_ICONS = [plantPotIcon, dragonStatueIcon, lampIcon];

const getIconForCategory = (name: string, index: number) => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("rồng") || lowerName.includes("tượng") || lowerName.includes("linh vật")) {
    return dragonStatueIcon;
  }
  if (lowerName.includes("đèn") || lowerName.includes("trang trí")) {
    return lampIcon;
  }
  if (
    lowerName.includes("cây") ||
    lowerName.includes("chậu") ||
    lowerName.includes("thực vật") ||
    lowerName.includes("hoa")
  ) {
    return plantPotIcon;
  }
  if (lowerName.includes("tinh thể") || lowerName.includes("đá phong thủy")) {
    return crystalIcon;
  }
  if (lowerName.includes("trầm hương")) {
    return agarwoodIcon;
  }

  // Fallback if no keywords match
  return CATEGORY_ICONS[index % CATEGORY_ICONS.length];
};

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

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {categories.map((cat, index) => {
            const icon = getIconForCategory(cat.name, index);
            return (
              <Link
                key={cat.id}
                to={`/products?categoryId=${cat.id}`}
                className="group flex flex-col items-center justify-between gap-3 rounded-2xl bg-gray-50/80 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:p-5 w-28 sm:w-36 border border-transparent hover:border-primary/20"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100 transition-transform duration-500 group-hover:scale-110 sm:h-16 sm:w-16">
                  <img
                    src={icon}
                    alt={cat.name}
                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-sm transition-transform duration-500 group-hover:-rotate-3"
                  />
                </div>
                <span className="text-center text-xs font-semibold text-gray-700 transition-colors duration-300 group-hover:text-primary sm:text-sm line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
