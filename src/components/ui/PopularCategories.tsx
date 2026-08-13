import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import type { Category } from "@/features/category/types/category";
import dragonStatueIcon from "@/assets/icon/DragonStatue.png";
import lampIcon from "@/assets/icon/Lamp.png";
import plantPotIcon from "@/assets/icon/PlantPot.png";
import crystalIcon from "@/assets/icon/Crystal.png";
import agarwoodIcon from "@/assets/icon/TramHuong.png";
import terrariumIcon from "@/assets/icon/Terrarium.png";
import fountainIcon from "@/assets/icon/Fountain.png";

const CATEGORY_ICONS = [plantPotIcon, dragonStatueIcon, lampIcon];

const getIconForCategory = (name: string, index: number) => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("rồng") || lowerName.includes("tượng") || lowerName.includes("linh vật")) {
    return dragonStatueIcon;
  }
  if (lowerName.includes("đèn") || lowerName.includes("trang trí")) {
    return lampIcon;
  }
  if (lowerName.includes("terrarium")) {
    return terrariumIcon;
  }
  if (lowerName.includes("thác nước")) {
    return fountainIcon;
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
  const { t } = useTranslation();
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
    <section className="mt-6 min-w-0 overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:mt-8 sm:p-4">
      {/* Header */}
      <div className="-mx-3 -mt-3 mb-4 flex items-center justify-between sm:-mx-4 sm:-mt-4">
        <div className="relative inline-block">
          {/* Dark teal fold phía sau */}
          <div
            className="absolute right-0 h-full w-12 sm:w-12 bg-teal-900"
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
          />

          {/* Badge chính */}
          <h2
            className="relative z-10 rounded-tl-xl bg-primary
              px-4 py-2 pr-12 text-sm font-bold uppercase tracking-wide text-white
              sm:px-4 sm:py-2 sm:pr-16 sm:text-xl"
            style={{
              clipPath: "polygon(0 0, calc(100% - 28px) 0, 100% 100%, 0 100%)",
            }}
          >
            {t("popular_categories.title")}
          </h2>
        </div>

        <Link
          to="/products"
          className="mr-5 shrink-0 cursor-pointer text-xs font-medium text-primary transition-colors hover:text-primary-dark sm:text-sm"
        >
          {t("popular_categories.view_all")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 sm:gap-6 px-1 py-2 sm:px-2 sm:py-3">
        {categories.map((cat, index) => {
          const icon = getIconForCategory(cat.name, index);
          return (
            <Link
              key={cat.id}
              to={`/products?categoryId=${cat.id}`}
              className="group flex flex-col items-center justify-between gap-3 rounded-2xl bg-gray-50 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:p-5 w-28 sm:w-36 border border-gray-200 hover:border-primary/40"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 transition-transform duration-500 group-hover:scale-110 sm:h-16 sm:w-16">
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
    </section>
  );
}
