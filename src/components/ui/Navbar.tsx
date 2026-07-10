import { Truck, Package, User, LogOut, Sparkles, Store } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SearchBar from "./Search";
import AiAssistantDrawer from "@/features/chatbox/components/AiAssistantDrawer";
import PopUpLogin from "@/features/auth/components/PopUpLogin";
import PopUpSignUp from "@/features/auth/components/PopUpSignUp";
import { CartDropDown, useCart } from "@/features/cart";
import { NotificationDropdown } from "@/features/notification";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { useHasSellerWorkspaceAccess } from "@/features/shop/hooks/useShopStaff";
import { getRoles } from "@/lib/workspace";
import { useAppSelector, useAppDispatch } from "@/app/store";
import { logout, setAuthModal } from "@/features/auth/store/authSlice";
import { logoutRequest } from "@/features/auth/api/auth.api";
import { clearSession } from "@/utils";
import Logo from "@/assets/image/fengdesk_logo_2.png";

export default function Navbar() {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/products`);
    }
  };

  const { user, authModal, refreshToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { getCart, clearCart } = useCart();
  const { hasSellerWorkspaceAccess } = useHasSellerWorkspaceAccess(!!user);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userDropdownClosing, setUserDropdownClosing] = useState(false);
  const userDropdownRootRef = useRef<HTMLDivElement>(null);
  const userDropdownCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeUserDropdown = useCallback(() => {
    setUserDropdownClosing(true);
    userDropdownCloseTimeoutRef.current = setTimeout(() => {
      setUserDropdownOpen(false);
      setUserDropdownClosing(false);
    }, 150);
  }, []);

  const openUserDropdown = useCallback(() => {
    if (userDropdownCloseTimeoutRef.current) {
      clearTimeout(userDropdownCloseTimeoutRef.current);
      userDropdownCloseTimeoutRef.current = null;
    }
    setUserDropdownClosing(false);
    setUserDropdownOpen(true);
  }, []);

  useEffect(() => {
    return () => {
      if (userDropdownCloseTimeoutRef.current) clearTimeout(userDropdownCloseTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!userDropdownOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeUserDropdown();
    };
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const el = userDropdownRootRef.current;
      if (el && !el.contains(e.target as Node)) closeUserDropdown();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [userDropdownOpen, closeUserDropdown]);

  // Trợ lý AI giờ là KHUNG CHAT trượt bên hông (thay cho trang /ai full-screen).
  const [aiOpen, setAiOpen] = useState(false);
  const openAiAssistant = () => {
    if (!user) {
      dispatch(setAuthModal("login"));
      toast.info("Vui lòng đăng nhập để dùng trợ lý AI");
      return;
    }
    setAiOpen(true);
  };

  useEffect(() => {
    if (user) {
      getCart();
    } else {
      clearCart();
    }
  }, [user, getCart, clearCart]);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutRequest({ refreshToken });
      }
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearSession();
      dispatch(logout());
      toast.success("Đăng xuất thành công");
    }
  };

  const getLastName = (fullname?: string) => {
    if (!fullname) return "";
    const nameArr = fullname.split(" ");
    return nameArr[nameArr.length - 1];
  };

  const lastName = getLastName(user?.fullName);

  return (
    <header className="sticky top-0 z-50 w-full min-w-0">
      <style>{`
        @keyframes nav-dropdown-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes nav-dropdown-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
        }
        .nav-dropdown-enter {
          animation: nav-dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: top right;
        }
        .nav-dropdown-exit {
          animation: nav-dropdown-out 0.15s ease-in both;
          transform-origin: top right;
        }
      `}</style>
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
            <a href="/" className="flex shrink-0 items-center gap-2" aria-label="FengDesk home">
              <div className="flex h-8 w-8 items-center justify-center  sm:h-12 sm:w-12">
                <img src={Logo} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl">
                Feng<span className="text-primary">Desk</span>
              </span>
            </a>

            {/* Search — grows in the middle, hidden on mobile (shown below) */}
            <div className="hidden flex-1 md:block">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* Spacer so icons always push right on mobile */}
            <div className="flex-1 md:hidden" />

            {/* Icon group — always visible */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              {user && <WorkspaceSwitcher />}

              <button
                type="button"
                onClick={openAiAssistant}
                className="flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary cursor-pointer"
                aria-label="Trợ lý AI"
              >
                <Sparkles size={22} strokeWidth={1.8} />
                <span className="hidden text-[10px] font-medium sm:block sm:text-xs">
                  Trợ lý AI
                </span>
              </button>

              {user && <NotificationDropdown />}

              {user ? (
                <div ref={userDropdownRootRef} className="relative group flex flex-col items-center" onMouseEnter={openUserDropdown} onMouseLeave={closeUserDropdown}>
                  <button
                    type="button"
                    className="flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary cursor-pointer"
                    aria-label="Tài khoản"
                    onClick={() => { closeUserDropdown(); navigate("/profile/info"); }}
                  >
                    <div className="flex size-[22px] items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                      {lastName ? lastName.charAt(0) : <User size={14} />}
                    </div>
                    <span className="hidden text-[10px] font-medium sm:block sm:text-xs max-w-[60px] truncate">
                      {lastName || "User"}
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  {userDropdownOpen && (
                    <div className={`absolute right-0 top-full mt-0 flex w-48 flex-col rounded-lg bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5 z-50 overflow-hidden ${userDropdownClosing ? "nav-dropdown-exit" : "nav-dropdown-enter"}`}>
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.fullName || "Người dùng"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => { closeUserDropdown(); navigate("/profile/info"); }}
                          className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors text-left font-medium cursor-pointer"
                        >
                          Tài Khoản Của Tôi
                        </button>
                        <button
                          onClick={() => { closeUserDropdown(); navigate("/profile/workspace"); }}
                          className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors text-left font-medium cursor-pointer"
                        >
                          Không Gian Làm Việc
                        </button>
                        <button
                          onClick={() => { closeUserDropdown(); navigate("/profile/orders"); }}
                          className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors text-left font-medium cursor-pointer"
                        >
                          Đơn Mua
                        </button>
                        {/* Người bán đã có khu riêng ở switcher "Đổi khu" → avatar chỉ giữ CTA cho người chưa bán. */}
                        {!getRoles(user).includes("GardenOwner") && !hasSellerWorkspaceAccess && (
                          <button
                            onClick={() => { closeUserDropdown(); navigate("/become-seller"); }}
                            className="flex w-full items-center px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-md transition-colors text-left font-medium cursor-pointer"
                          >
                            <Store size={16} className="mr-2" />
                            Trở thành người bán
                          </button>
                        )}

                        <button
                          onClick={() => { closeUserDropdown(); handleLogout(); }}
                          className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors text-left font-medium cursor-pointer"
                        >
                          <LogOut size={16} className="mr-2" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => dispatch(setAuthModal("login"))}
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
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <PopUpLogin
        open={authModal === "login"}
        onClose={() => dispatch(setAuthModal(null))}
        onSwitchToSignUp={() => dispatch(setAuthModal("signup"))}
      />
      <PopUpSignUp
        open={authModal === "signup"}
        onClose={() => dispatch(setAuthModal(null))}
        onSwitchToLogin={() => dispatch(setAuthModal("login"))}
      />

      <AiAssistantDrawer key={user?.id ?? "guest"} open={aiOpen} onClose={() => setAiOpen(false)} />
    </header>
  );
}
