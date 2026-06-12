import {
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Footprints,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

export interface Category {
  id: number;
  label: string;
  icon: React.ReactNode;
  image?: string;
  href: string;
  color: string;
}

const CATEGORIES: Category[] = [
  {
    id: 1,
    label: "Điện thoại",
    icon: <Smartphone className="h-7 w-7" />,
    image:
      "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/ip15-pro-max.png",
    href: "/dien-thoai",
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: 2,
    label: "Laptop",
    icon: <Laptop className="h-7 w-7" />,
    image:
      "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/macbook-air-m2-2022.png",
    href: "/laptop",
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: 3,
    label: "Tai nghe",
    icon: <Headphones className="h-7 w-7" />,
    image:
      "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-wh-1000xm5-1.png",
    href: "/tai-nghe",
    color: "bg-sky-50 text-sky-600",
  },
  {
    id: 4,
    label: "Đồng hồ",
    icon: <Watch className="h-7 w-7" />,
    image:
      "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/a/p/apple-watch-s9-1.png",
    href: "/dong-ho",
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: 5,
    label: "Giày dép",
    icon: <Footprints className="h-7 w-7" />,
    href: "/giay-dep",
    color: "bg-rose-50 text-rose-500",
  },
  {
    id: 6,
    label: "Túi xách",
    icon: <ShoppingBag className="h-7 w-7" />,
    href: "/tui-xach",
    color: "bg-orange-50 text-orange-500",
  },
  {
    id: 7,
    label: "Mỹ phẩm",
    icon: <Sparkles className="h-7 w-7" />,
    href: "/my-pham",
    color: "bg-pink-50 text-pink-500",
  },
  {
    id: 8,
    label: "Đồ gia dụng",
    icon: <UtensilsCrossed className="h-7 w-7" />,
    href: "/do-gia-dung",
    color: "bg-green-50 text-green-600",
  },
];

interface CategoryItemProps {
  category: Category;
}

function CategoryItem({ category }: CategoryItemProps) {
  return (
    <a href={category.href} className="group flex flex-col items-center gap-2 focus:outline-none">
      {/* Circle icon/image */}
      <div
        className={`
                    relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full
                    ring-2 ring-transparent transition-all duration-300
                    group-hover:ring-primary group-hover:shadow-md group-hover:-translate-y-1
                    sm:h-16 sm:w-16
                    ${category.image ? "bg-gray-50" : category.color}
                `}
      >
        {category.image ? (
          <img
            src={category.image}
            alt={category.label}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <span className={category.color.split(" ")[1]}>{category.icon}</span>
        )}
      </div>

      {/* Label */}
      <span className="line-clamp-2 w-full px-0.5 text-center text-[10px] font-medium leading-tight text-gray-700 transition-colors duration-200 group-hover:text-primary sm:text-xs">
        {category.label}
      </span>
    </a>
  );
}

interface PopularCategoriesProps {
  categories?: Category[];
}

export default function PopularCategories({ categories = CATEGORIES }: PopularCategoriesProps) {
  return (
    <section className="mt-6 min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <h2 className="text-base font-bold text-gray-800 sm:text-lg">Danh mục nổi bật</h2>
        <a
          href="/danh-muc"
          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-dark sm:text-sm"
        >
          Xem tất cả &rsaquo;
        </a>
      </div>

      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 sm:p-4">
        <div className="grid grid-cols-4 gap-x-1 gap-y-4 sm:grid-cols-8 sm:gap-x-2 sm:gap-y-5">
          {categories.map((cat) => (
            <CategoryItem key={cat.id} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
