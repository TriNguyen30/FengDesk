import HeroSlider, { HeroSlide } from "@/components/ui/HeroSlider";
import FeatureBar from "@/components/ui/FeatureBar";
import CategoryBar from "@/components/ui/CategoryBar";
import PopularCategories from "@/components/ui/PopularCategories";
import { BestSellersSection } from "@/features/products/components/ProductCard";
import FiveElementsSection from "../components/FiveElementsSection";
import ImageCollections from "../components/ImageCollections";

const slides: HeroSlide[] = [
  {
    id: 1,
    badge: "FENGDESK AI",
    title: "Khám Phá Cây Phong Thủy",
    highlight: "Tương Sinh",
    desc1: "Tư vấn cây hợp mệnh bằng AI",
    desc2: "Mang lại may mắn & tài lộc",
    image:
      "https://i.ex-cdn.com/danviet.vn/files/content/2026/01/01/031026tai-voi-lai-cay-canh-a-0222.jpg",
    primaryBtn: "Trải nghiệm AI",
    secondaryBtn: "Xem thêm",
  },
  {
    id: 2,
    badge: "BỘ SƯU TẬP",
    title: "Góc Làm Việc",
    highlight: "Lý Tưởng",
    desc1: "Thanh lọc không khí, giảm căng thẳng",
    desc2: "Phù hợp mọi không gian văn phòng",
    image:
      "https://i.ex-cdn.com/danviet.vn/files/content/2025/12/30/025751ngoc-bich-cay-canh-a2-0254.jpg",
    primaryBtn: "Khám phá",
    secondaryBtn: "Xem thêm",
  },
  {
    id: 3,
    badge: "ƯU ĐÃI",
    title: "Cây Cảnh Để Bàn",
    highlight: "GIẢM 20%",
    desc1: "Thiết kế chậu sành sứ cao cấp",
    desc2: "Giao hàng an toàn tận nơi",
    image:
      "https://tapchivietnamhuongsac.vn/stores/news_dataimages/2026/042026/06/09/capture20260406090848.jpg?rt=20260406090850",
    primaryBtn: "Mua ngay",
    secondaryBtn: "Xem thêm",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full min-w-0 max-w-screen-xl px-3 py-4 sm:px-4 sm:py-6 lg:px-10">
      <CategoryBar />
      <HeroSlider slides={slides} />
      <FeatureBar />
      <FiveElementsSection />
      <PopularCategories />
      <BestSellersSection />
      <ImageCollections />
    </main>
  );
}
