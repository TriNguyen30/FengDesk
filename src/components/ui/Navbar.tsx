import { Truck, Package, User, Leaf } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SearchBar from "./Search";
import PopUpLogin from "@/features/auth/components/PopUpLogin";
import PopUpSignUp from "@/features/auth/components/PopUpSignUp";
import { CartDropDown } from "@/features/cart";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/features/auth/store/authSlice";
import { logoutRequest } from "@/features/auth/api/authApi";

export default function Navbar() {
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);
  
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await logoutRequest({ refreshToken });
      }
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      dispatch(logout());
      localStorage.removeItem("refreshToken");
      toast.success("Đăng xuất thành công");
    }
  };

  return (
    <div className="w-full min-w-0">
      {/* Top promo bar — single line, always visible */}
      <div className="w-full border-b border-gray-200 bg-gray-100 px-3 py-1.5 sm:px-4">
        <div className="mx-auto flex min-w-0 max-w-screen-xl items-center justify-between gap-2 text-[11px] text-gray-600 sm:text-xs">
          <div className="flex min-w-0 items-center gap-2 sm:gap-5">
            <div className="flex items-center gap-1.5">
              <Truck size={13} className="shrink-0" />
              <span className="font-medium">
                {/* Short on mobile, full on sm+ */}
                <span className="sm:hidden">Freeship từ 500k</span>
                <span className="hidden sm:inline">Miễn phí vận chuyển từ 500.000đ</span>
              </span>
            </div>
            <div className="hidden items-center gap-1.5 md:flex">
              <Package size={13} className="shrink-0" />
              <span className="font-medium">Đổi trả trong 7 ngày</span>
            </div>
          </div>
          <span className="shrink-0 font-medium">
            <span className="sm:hidden">1900 1234</span>
            <span className="hidden sm:inline">
              Hỗ trợ: <strong>1900 1234</strong>
            </span>
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="w-full bg-white shadow-sm">
        <div className="mx-auto max-w-screen-xl px-4 py-3 sm:px-6 lg:px-10">
          {/* Row 1: Logo + Icons (mobile) / Logo + Search + Icons (desktop) */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Logo */}
            <a
              href="/"
              className="flex shrink-0 items-center gap-2"
              aria-label="FengDesk home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary sm:h-9 sm:w-9">
                <Leaf size={18} className="text-white sm:size-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl">
                Feng<span className="text-primary">Desk</span>
              </span>
            </a>

            {/* Search — grows in the middle, hidden on mobile (shown below) */}
            <div className="hidden flex-1 md:block">
              <SearchBar placeholder="Bạn cần tìm gì?" onSearch={handleSearch} />
            </div>

            {/* Spacer so icons always push right on mobile */}
            <div className="flex-1 md:hidden" />

            {/* Icon group — always visible */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              {user ? (
                <div className="relative group flex flex-col items-center">
                  <button
                    type="button"
                    className="flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary cursor-pointer"
                    aria-label="Tài khoản"
                  >
                    <div className="flex size-[22px] items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={14} />}
                    </div>
                    <span className="hidden text-[10px] font-medium sm:block sm:text-xs max-w-[60px] truncate">
                      {user.fullName || "User"}
                    </span>
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-0 hidden w-48 flex-col rounded-lg bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5 group-hover:flex z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName || "Người dùng"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors text-left font-medium cursor-pointer"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModal("login")}
                  className="flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary active:bg-gray-100 cursor-pointer"
                  aria-label="Tài khoản"
                >
                  <User size={22} strokeWidth={1.8} />
                  <span className="hidden text-[10px] font-medium sm:block sm:text-xs">
                    Tài khoản
                  </span>
                </button>
              )}

              <div className="h-6 w-px bg-gray-200" />

              <CartDropDown />
            </div>
          </div>

          {/* Row 2: Search bar — mobile only, full width */}
          <div className="mt-2.5 md:hidden">
            <SearchBar placeholder="Bạn cần tìm gì?" onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <PopUpLogin
        open={authModal === "login"}
        onClose={() => setAuthModal(null)}
        onSwitchToSignUp={() => setAuthModal("signup")}
      />
      <PopUpSignUp
        open={authModal === "signup"}
        onClose={() => setAuthModal(null)}
        onSwitchToLogin={() => setAuthModal("login")}
      />
    </div>
  );
}