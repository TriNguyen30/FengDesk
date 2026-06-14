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
  Bell
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/features/auth/store/authSlice";

const navigation = [
  { name: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/manager/products", icon: Package },
  { name: "Orders", href: "/manager/orders", icon: ShoppingCart },
  { name: "Customers", href: "/manager/customers", icon: Users },
  { name: "Settings", href: "/manager/settings", icon: Settings },
];

export default function ManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/manager/dashboard" className="text-2xl font-bold text-primary">
            FengShui Manager
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-green-50 hover:text-primary"
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-3 font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 z-10">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-primary transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || "M"}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium text-gray-700">{user?.fullName || "Manager"}</p>
                <p className="text-gray-500 text-xs capitalize">{user?.role || "Manager"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
