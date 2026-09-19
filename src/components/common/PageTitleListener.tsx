import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Trang chủ",
  "/about": "Giới thiệu",
  "/contact": "Liên hệ",
  "/news": "Tin tức",
  "/products": "Sản phẩm Phong Thủy",
  "/cart": "Giỏ hàng",
  "/checkout": "Thanh toán đơn hàng",
  "/seller": "Quản lý Cửa hàng của tôi",
  "/become-seller": "Đăng ký Cửa hàng mới",
  "/payment/success": "Thanh toán thành công",
  "/payment/cancel": "Hủy thanh toán",

  // Profile
  "/profile": "Thông tin cá nhân",
  "/profile/info": "Thông tin cá nhân",
  "/profile/addresses": "Sổ địa chỉ",
  "/profile/workspace": "Không gian Phong Thủy",
  "/profile/orders": "Đơn mua của tôi",
  "/profile/returns": "Yêu cầu Trả hàng",
  "/profile/invitations": "Lời mời làm việc",
  "/profile/notifications": "Thông báo hệ thống",

  // Manager
  "/manager": "Manager Dashboard",
  "/manager/dashboard": "Manager Dashboard",
  "/manager/categories": "Quản lý Danh mục",
  "/manager/products": "Quản lý Sản phẩm",
  "/manager/products/new": "Thêm Sản phẩm mới",
  "/manager/model3d-queue": "Hàng chờ Model 3D",
  "/manager/orders": "Quản lý Đơn hàng",
  "/manager/order-returns": "Quản lý Trả hàng",
  "/manager/customers": "Hỗ trợ Khách hàng",
  "/manager/stores": "Quản lý Chi nhánh",
  "/manager/settings/account": "Cài đặt Tài khoản",

  // Admin
  "/admin": "Admin Dashboard",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/users": "Quản lý Người dùng",
  "/admin/element-tags": "Quản lý Thẻ Ngũ hành",
  "/admin/stores": "Quản lý Cửa hàng Hệ thống",
  "/admin/settings/account": "Cài đặt Admin",
};

export default function PageTitleListener() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    // Direct match
    if (ROUTE_TITLES[pathname]) {
      document.title = `${ROUTE_TITLES[pathname]} - Feng Shui Garden`;
      return;
    }

    // Dynamic prefix matches if not set by page hook
    if (pathname.startsWith("/seller/") && pathname.includes("/deliveries")) {
      document.title = "Đơn giao Cửa hàng - Feng Shui Garden";
    } else if (pathname.startsWith("/seller/") && pathname.includes("/returns")) {
      document.title = "Đơn trả Cửa hàng - Feng Shui Garden";
    } else if (pathname.startsWith("/seller/") && pathname.includes("/staff")) {
      document.title = "Quản lý Nhân viên Cửa hàng - Feng Shui Garden";
    } else if (pathname.startsWith("/seller/") && pathname.includes("/products/new")) {
      document.title = "Tạo Sản phẩm Cửa hàng - Feng Shui Garden";
    }
  }, [location.pathname]);

  return null;
}
