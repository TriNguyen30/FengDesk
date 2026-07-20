import { Outlet, NavLink } from "react-router-dom";
import { User, MapPin, Package, HousePlus, Bell, RefreshCw, Mail } from "lucide-react";
import { useEffect } from "react";
import { useMyStoreInvitations } from "@/features/shop/hooks/useShopStaff";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function ProfileLayout() {
  // Load lời mời (nhẹ) để hiện badge số lượng bên cạnh menu; nếu 0 thì ẩn badge.
  const { invitations } = useMyStoreInvitations();
  const pendingCount = invitations.length;

  const navItems: {
    name: string;
    path: string;
    icon: typeof User;
    badge?: number;
  }[] = [
    { name: "Thông tin tài khoản", path: "/profile/info", icon: User },
    { name: "Địa chỉ", path: "/profile/addresses", icon: MapPin },
    { name: "Không gian làm việc", path: "/profile/workspace", icon: HousePlus },
    { name: "Đơn hàng của tôi", path: "/profile/orders", icon: Package },
    { name: "Yêu cầu trả hàng", path: "/profile/returns", icon: RefreshCw },
    {
      name: "Lời mời làm nhân viên",
      path: "/profile/invitations",
      icon: Mail,
      badge: pendingCount,
    },
    { name: "Thông báo", path: "/profile/notifications", icon: Bell },
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-64">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 px-2 text-lg font-bold text-gray-900">Hồ Sơ</h2>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
              <ThemeToggle variant="sidebar" />
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm min-h-[400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
