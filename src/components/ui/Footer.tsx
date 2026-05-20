import { Leaf, Mail, Phone, MapPin } from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-12">
          {/* Brand & Contact */}
          <div className="flex flex-col gap-4">
            <a
              href="/"
              className="flex items-center gap-2"
              aria-label="FengDesk home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                <Leaf size={20} className="text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-gray-900">
                Feng<span className="text-primary">Desk</span>
              </span>
            </a>
            <p className="text-sm leading-relaxed text-gray-600">
              Mang đến không gian làm việc cân bằng, thịnh vượng và tràn đầy
              năng lượng tích cực với các vật phẩm phong thủy tinh tế.
            </p>
            <ul className="mt-2 flex flex-col gap-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <MapPin size={18} className="shrink-0 text-primary mt-0.5" />
                <span>Khu CNC, Quận 9, Thủ Đức</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={18} className="shrink-0 text-primary" />
                <span>1900 1234</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={18} className="shrink-0 text-primary" />
                <span>support@fengdesk.vn</span>
              </li>
            </ul>
          </div>

          {/* About Us */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Về FengDesk
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Câu chuyện thương hiệu
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Tuyển dụng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Tin tức phong thủy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Hỗ trợ khách hàng
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Chính sách vận chuyển
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Chính sách đổi trả
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Hướng dẫn mua hàng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Câu hỏi thường gặp (FAQ)
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter & Socials */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Đăng ký nhận tin
            </h3>
            <p className="text-sm text-gray-600">
              Nhận thông tin mới nhất về sản phẩm và các ưu đãi đặc biệt.
            </p>
            <form className="flex w-full mt-1">
              <input
                type="email"
                placeholder="Email của bạn"
                className="w-full rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <button
                type="submit"
                className="rounded-r-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Gửi
              </button>
            </form>
            <div className="mt-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Kết nối với chúng tôi
              </h3>
              <div className="flex items-center gap-4 text-gray-400">
                <a href="#" className="hover:text-primary transition-colors">
                  <span className="sr-only">Facebook</span>
                  <FaFacebook size={20} />
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  <span className="sr-only">Instagram</span>
                  <FaInstagram size={20} />
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  <span className="sr-only">Twitter</span>
                  <FaTiktok size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} FengDesk. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-primary transition-colors">
              Điều khoản dịch vụ
            </a>
            <span className="h-4 w-px bg-gray-300"></span>
            <a href="#" className="hover:text-primary transition-colors">
              Chính sách bảo mật
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
