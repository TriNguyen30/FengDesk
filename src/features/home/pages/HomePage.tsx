import HeroSlider, { HeroSlide } from "@/components/ui/HeroSlider";
import FeatureBar from "@/components/ui/FeatureBar";
import CategoryBar from "@/components/ui/CategoryBar";
import PopularCategories from "@/components/ui/PopularCategories";
import { BestSellersSection } from "@/features/products/components/ProductCard";
import FiveElementsSection from "../components/FiveElementsSection";
import ImageCollections from "../components/ImageCollections";
import CommitmentPage from "@/components/ui/CommitmentPage";
import { useTranslation } from "react-i18next";
export default function HomePage() {
  const { t } = useTranslation();

  const slides: HeroSlide[] = [
    {
      id: 1,
      badge: t("hero_slider.slide1.badge"),
      title: t("hero_slider.slide1.title"),
      highlight: t("hero_slider.slide1.highlight"),
      desc1: t("hero_slider.slide1.desc1"),
      desc2: t("hero_slider.slide1.desc2"),
      image:
        "https://images.squarespace-cdn.com/content/v1/663638597899f63cfa9deca6/1736727318707-KPNZ2QBTGEXVXAEC6WK8/7.16.24+Bristol+Botanics-27.jpg",
      primaryBtn: t("hero_slider.slide1.primaryBtn"),
      secondaryBtn: t("hero_slider.slide1.secondaryBtn"),
    },
    {
      id: 2,
      badge: t("hero_slider.slide2.badge"),
      title: t("hero_slider.slide2.title"),
      highlight: t("hero_slider.slide2.highlight"),
      desc1: t("hero_slider.slide2.desc1"),
      desc2: t("hero_slider.slide2.desc2"),
      image:
        "https://s.yimg.com/ny/api/res/1.2/OjlgtatUjnfv6rMRAgVNSA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTU0MDtjZj13ZWJw/https://media.zenfs.com/en/real_homes_245/4b07f622a522e2e612f3336385080532",
      primaryBtn: t("hero_slider.slide2.primaryBtn"),
      secondaryBtn: t("hero_slider.slide2.secondaryBtn"),
    },
    {
      id: 3,
      badge: t("hero_slider.slide3.badge"),
      title: t("hero_slider.slide3.title"),
      highlight: t("hero_slider.slide3.highlight"),
      desc1: t("hero_slider.slide3.desc1"),
      desc2: t("hero_slider.slide3.desc2"),
      image:
        "https://www.thespruce.com/thmb/fQjL1wNf72Ez89dkS-VwpiQGiAM=/6127x0/filters:no_upscale():max_bytes(150000):strip_icc()/thespruce.com-best-houseplants-for-sun-4147670-1-3d69cd3cf2b943d9aa8363cde764e595.jpg",
      primaryBtn: t("hero_slider.slide3.primaryBtn"),
      secondaryBtn: t("hero_slider.slide3.secondaryBtn"),
    },
  ];

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
        <CommitmentPage />
      </main>
    </>
  );
}
