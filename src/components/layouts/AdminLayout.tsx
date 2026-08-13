import { useState, type CSSProperties } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import {
  LayoutDashboard,
  Users,
  Store,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Settings,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/app/store";
import { logout } from "@/features/auth/store/authSlice";
import { clearSession } from "@/utils";
import WorkspaceSwitcher from "@/components/ui/WorkspaceSwitcher";
import FooterManager from "@/components/ui/FooterManager";
import FengDesk from "@/assets/image/fengdesk_logo_2.png";

const toasterStyle = { "--width": "min(100vw - 1.5rem, 356px)" } as CSSProperties;

const navigation = [
  { name: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Cửa hàng", href: "/admin/stores", icon: Store },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
];

const roleLabels: Record<string, string> = {
  manager: "Quản lý",
  admin: "Quản trị viên",
  staff: "Nhân viên",
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    clearSession();
    dispatch(logout());
  };

  let currentNavName = "Tổng quan";
  for (const item of navigation) {
    if (item.href && location.pathname.startsWith(item.href)) {
      currentNavName = item.name;
      break;
    }
  }
  const pageTitle = currentNavName;

  const initial = user?.fullName?.charAt(0) || user?.email?.charAt(0) || "A";
  const roleLabel = roleLabels[user?.role?.toLowerCase() ?? ""] ?? user?.role ?? "Quản trị viên";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        // Mảng tối có chủ đích ở cả hai theme — đánh dấu để dark theme không lật
        // thang slate ở đây (xem :root[data-theme="dark"] [data-fd-chrome] trong index.css).
        data-fd-chrome="dark"
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 transition-all duration-300 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4 bg-slate-950">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <img src={FengDesk} alt="FengDesk" className="h-9 w-9 ml-1.5" />
            {!collapsed && (
              <span className="whitespace-nowrap">
                <span className="text-md font-extrabold tracking-tight text-white">
                  Feng<span className="text-primary">Desk</span>
                </span>
                <span className="block text-xs leading-tight text-slate-400">Quản trị hệ thống</span>
              </span>
            )}
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={22} className="text-slate-400 hover:text-slate-200" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => {
            const isActive = item.href ? location.pathname.startsWith(item.href) : false;

            return (
              <div key={item.name} className="space-y-1">
                <Link
                  to={item.href!}
                  title={collapsed ? item.name : undefined}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? "bg-primary text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-white" />
                  )}
                  <item.icon
                    size={19}
                    className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-300"}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="mx-3 mb-2 hidden items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 lg:flex cursor-pointer"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && "Thu gọn"}
        </button>

        {/* User + logout */}
        <div className="border-t border-slate-800 p-3 bg-slate-950">
          <div
            className={`mb-2 flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? "justify-center" : ""
              }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
              {initial}
            </div>
            {!collapsed && (
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium text-white">
                  {user?.fullName || "Người quản trị"}
                </p>
                <p className="truncate text-xs text-slate-400">{roleLabel}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={collapsed ? "Đăng xuất" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 cursor-pointer ${collapsed ? "justify-center" : ""
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
        <header className="z-10 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
          <button
            className="text-slate-500 hover:text-slate-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Quản trị hệ thống</p>
            <h1 className="truncate text-lg font-semibold text-slate-900">{pageTitle}</h1>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <WorkspaceSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex flex-1 flex-col overflow-y-auto bg-slate-50">
          <div className="flex-1 p-4 sm:p-6">
            <Outlet />
          </div>
          <FooterManager />
        </main>

        <Toaster
          richColors
          closeButton
          position="top-right"
          className="top-[max(0.75rem,env(safe-area-inset-top))]! right-[max(0.75rem,env(safe-area-inset-right))]! sm:top-4! sm:right-4!"
          style={toasterStyle}
        />
      </div>
    </div>
  );
}
