import HeroSlider from "@/components/ui/HeroSlider";
import hero1 from "../../src/assets/hero.png";
import hero2 from "../../src/assets/image/FengShuiWallpaper.png";

export function Default() {
  return (
    <HeroSlider
      slides={[
        {
          id: 1,
          badge: "MỚI",
          title: "Cây phong thủy",
          highlight: "cho không gian làm việc",
          desc1: "Chọn cây hợp mệnh, hợp hướng, mang lại tài lộc và bình an.",
          desc2: "Giao hàng toàn quốc trong 24h, đóng gói cẩn thận.",
          image: hero1,
          primaryBtn: "Mua ngay",
          secondaryBtn: "Tư vấn miễn phí",
        },
        {
          id: 2,
          badge: "ƯU ĐÃI",
          title: "Giảm 20%",
          highlight: "cho đơn hàng đầu tiên",
          desc1: "Áp dụng cho mọi sản phẩm cây cảnh và vật phẩm phong thủy.",
          desc2: "Nhập mã FENGDESK20 khi thanh toán để nhận ưu đãi.",
          image: hero2,
          primaryBtn: "Xem ưu đãi",
          secondaryBtn: "Tìm hiểu thêm",
        },
      ]}
    />
  );
}
