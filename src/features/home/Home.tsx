import HeroSlider, { HeroSlide } from "@/components/ui/HeroSlider";
import FeatureBar from "@/components/ui/FeatureBar";
import CategoryBar from "@/components/ui/CategoryBar";
import PopularCategories from "@/components/ui/PopularCategories";
import { BestSellersSection } from "@/components/ui/ProductCard";
import ToastExample from "@/components/ui/ToastExample"

const slides: HeroSlide[] = [
    {
        id: 1,
        badge: "SALE UP TO",
        title: "Siêu sale cuối mùa",
        highlight: "50%",
        desc1: "Hàng ngàn sản phẩm chính hãng",
        desc2: "Giá tốt nhất dành cho bạn",
        image: "https://i.ex-cdn.com/danviet.vn/files/content/2026/01/01/031026tai-voi-lai-cay-canh-a-0222.jpg",
        primaryBtn: "Mua ngay",
        secondaryBtn: "Xem thêm",
    },
    {
        id: 2,
        badge: "HOT DEAL",
        title: "Công nghệ mới nhất",
        highlight: "30%",
        desc1: "Điện thoại, laptop, phụ kiện",
        desc2: "Giao hàng nhanh toàn quốc",
        image: "https://i.ex-cdn.com/danviet.vn/files/content/2025/12/30/025751ngoc-bich-cay-canh-a2-0254.jpg",
        primaryBtn: "Khám phá",
        secondaryBtn: "Xem thêm",
    },
    {
        id: 3,
        badge: "FLASH SALE",
        title: "Thời trang hè 2025",
        highlight: "40%",
        desc1: "Phong cách trẻ trung, năng động",
        desc2: "Cập nhật xu hướng mới nhất",
        image: "https://tapchivietnamhuongsac.vn/stores/news_dataimages/2026/042026/06/09/capture20260406090848.jpg?rt=20260406090850",
        primaryBtn: "Mua ngay",
        secondaryBtn: "Xem thêm",
    },
];

export default function HomePage() {
    return (
        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
            <CategoryBar />
            <HeroSlider slides={slides} />
            <FeatureBar />
            <PopularCategories />
            <BestSellersSection />
            <ToastExample />
        </main>
    );
}