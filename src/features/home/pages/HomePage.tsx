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
      "https://images.squarespace-cdn.com/content/v1/663638597899f63cfa9deca6/1736727318707-KPNZ2QBTGEXVXAEC6WK8/7.16.24+Bristol+Botanics-27.jpg",
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
      "https://s.yimg.com/ny/api/res/1.2/OjlgtatUjnfv6rMRAgVNSA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTU0MDtjZj13ZWJw/https://media.zenfs.com/en/real_homes_245/4b07f622a522e2e612f3336385080532",
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
      "https://www.thespruce.com/thmb/fQjL1wNf72Ez89dkS-VwpiQGiAM=/6127x0/filters:no_upscale():max_bytes(150000):strip_icc()/thespruce.com-best-houseplants-for-sun-4147670-1-3d69cd3cf2b943d9aa8363cde764e595.jpg",
    primaryBtn: "Mua ngay",
    secondaryBtn: "Xem thêm",
  },
];

export default function HomePage() {
  return (
    <>
      <main className="mx-auto w-full min-w-0 max-w-screen-xl px-3 py-4 sm:px-4 sm:py-6 lg:px-10">
        <CategoryBar />
        <HeroSlider slides={slides} />
        <ImageCollections />
        <FiveElementsSection />
        <PopularCategories />
        <BestSellersSection />
        <FeatureBar />
      </main>
    </>
  );
}
