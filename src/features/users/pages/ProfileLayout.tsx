import { Outlet, NavLink } from "react-router-dom";
import { User, MapPin, Package } from "lucide-react";

export default function ProfileLayout() {
  const navItems = [
    { name: "Thông tin tài khoản", path: "/profile/info", icon: User },
    { name: "Địa chỉ", path: "/profile/addresses", icon: MapPin },
    { name: "Đơn hàng của tôi", path: "/profile/orders", icon: Package },
  ];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-64">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 px-2 text-lg font-bold text-gray-900">Quản lý tài khoản</h2>
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
                    {item.name}
                  </NavLink>
                );
              })}
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
