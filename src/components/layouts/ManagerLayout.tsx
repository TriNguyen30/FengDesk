import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronsLeft,
  ChevronsRight,
  Store,
  TicketX,
  Tags,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/app/store";
import { logout } from "@/features/auth/store/authSlice";
import { clearSession } from "@/utils";
import WorkspaceSwitcher from "@/components/ui/WorkspaceSwitcher";
import FengDesk from "@/assets/image/fengdesk_logo_2.png";

const navigation = [
  { name: "Tổng quan", href: "/manager/dashboard", icon: LayoutDashboard },
  { name: "Danh mục", href: "/manager/categories", icon: Tags },
  { name: "Sản phẩm", href: "/manager/products", icon: Package },
  { name: "Cửa hàng", href: "/manager/stores", icon: Store },
  { name: "Đơn hàng", href: "/manager/orders", icon: ShoppingCart },
  { name: "Trả hàng", href: "/manager/order-returns", icon: TicketX },
  { name: "Khách hàng", href: "/manager/customers", icon: Users },
  // { name: "Cài đặt", href: "/manager/settings", icon: Settings },
];

const roleLabels: Record<string, string> = {
  manager: "Quản lý",
  admin: "Quản trị viên",
  staff: "Nhân viên",
};

const notifications = [
  {
    id: 1,
    message: "Đơn hàng mới #1024 vừa được đặt",
    time: "5 phút trước",
  },
  {
    id: 2,
    message: "Trầu Bà Thanh Xuân sắp hết hàng trong kho",
    time: "1 giờ trước",
  },
  {
    id: 3,
    message: "Khách hàng Nguyễn Văn A vừa đánh giá 5 sao",
    time: "3 giờ trước",
  },
];

export default function ManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    clearSession();
    dispatch(logout());
  };

  const currentNav = navigation.find((item) => location.pathname.startsWith(item.href));
  const pageTitle = currentNav?.name ?? "Tổng quan";

  const initial = user?.fullName?.charAt(0) || user?.email?.charAt(0) || "Q";
  const roleLabel = roleLabels[user?.role?.toLowerCase() ?? ""] ?? user?.role ?? "Quản lý";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white transition-all duration-300 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
          <Link to="/manager/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <img src={FengDesk} alt="FengDesk" className="h-9 w-9 ml-1.5" />
            {!collapsed && (
              <span className="whitespace-nowrap">
                <span className="block text-base font-bold leading-tight text-gray-900">
                  FengShui
                </span>
                <span className="block text-xs leading-tight text-gray-500">Quản lý cửa hàng</span>
              </span>
            )}
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={22} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                title={collapsed ? item.name : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  } ${collapsed ? "justify-center" : ""}`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <item.icon
                  size={19}
                  className={isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mx-3 mb-2 hidden items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 lg:flex cursor-pointer"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && "Thu gọn"}
        </button>

        {/* User + logout */}
        <div className="border-t border-gray-200 p-3">
          <div
            className={`mb-2 flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? "justify-center" : ""
              }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
              {initial}
            </div>
            {!collapsed && (
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium text-gray-800">
                  {user?.fullName || "Người quản lý"}
                </p>
                <p className="truncate text-xs text-gray-500">{roleLabel}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={collapsed ? "Đăng xuất" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer ${collapsed ? "justify-center" : ""
              }`}
          >
            <LogOut size={19} />
            {!collapsed && "Đăng xuất"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="z-10 flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
          <button
            className="text-gray-500 hover:text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Quản lý</p>
            <h1 className="truncate text-lg font-semibold text-gray-900">{pageTitle}</h1>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <WorkspaceSwitcher />

            {/* Search */}
            {/* <div className="relative hidden w-64 md:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm đơn hàng, sản phẩm, khách hàng..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div> */}

            {/* Notifications */}
            {/* <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Thông báo"
                className="relative text-gray-500 transition-colors hover:text-primary"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">Thông báo</p>
                    </div>
                    <ul className="max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className="border-b border-gray-50 px-4 py-3 last:border-b-0 hover:bg-gray-50"
                        >
                          <p className="text-sm text-gray-700">{n.message}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{n.time}</p>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/manager/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="block px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-primary/5"
                    >
                      Xem tất cả thông báo
                    </Link>
                  </div>
                </>
              )}
            </div> */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
