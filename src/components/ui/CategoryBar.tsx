import { useEffect, useRef, useState } from "react";
import { TextAlignJustify, ChevronDown } from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import type { Category } from "@/features/category/types/category";

const navItems = [
  { label: "Trang chủ", to: "/" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Giới thiệu", to: "/about" },
  { label: "Tin tức", to: "/news" },
  { label: "Liên Hệ", to: "/contact" },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "relative block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-300",
    "hover:bg-primary hover:text-primary-dark",
    "sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:pb-1 sm:hover:bg-transparent",
    "sm:after:absolute sm:after:left-0 sm:after:-bottom-1 sm:after:h-0.5 sm:after:bg-primary sm:after:transition-all sm:after:duration-300",
    isActive
      ? "bg-primary text-white sm:bg-transparent sm:text-primary sm:after:w-full"
      : "text-gray-700 sm:after:w-0 sm:hover:after:w-full",
  ].join(" ");

export default function CategoryBar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  return (
    <nav className="w-full min-w-0">
      <div className="mx-auto flex w-full min-w-0 max-w-screen-xl flex-col gap-2 px-3 py-2 sm:flex-row sm:items-stretch sm:gap-0 sm:px-4 sm:py-0 lg:px-10">
        <div ref={menuRef} className="relative shrink-0 sm:flex sm:items-center sm:pr-4 lg:pr-6">
          <button
            type="button"
            aria-expanded={menuOpen ? "true" : "false"}
            aria-controls="category-dropdown-menu"
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary sm:w-auto sm:border-0 sm:px-0 sm:py-3"
          >
            <span className="flex items-center gap-2">
              <TextAlignJustify size={18} className="shrink-0" />
              <span>Danh mục</span>
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div
            id="category-dropdown-menu"
            role="menu"
            className={`absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(70vh,24rem)] overflow-y-auto rounded-lg border border-gray-100 bg-white shadow-lg sm:left-0 sm:right-auto sm:mt-0 sm:w-56 sm:rounded-b-lg sm:rounded-t-none ${menuOpen ? "block" : "hidden"}`}
          >
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  navigate(`/products?categoryId=${item.id}`);
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm transition hover:bg-primary-light/20 hover:text-primary hover:ring-1 hover:ring-primary/40 cursor-pointer"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex min-h-[44px] items-center gap-1 overflow-x-auto overscroll-x-contain py-1 scrollbar-none sm:min-h-0 sm:flex-1 sm:gap-4 sm:px-4 sm:py-3 md:gap-6 lg:gap-8">
          {navItems.map((item) => (
            <li key={item.to} className="shrink-0">
              <NavLink to={item.to} end={item.to === "/"} className={navLinkClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
