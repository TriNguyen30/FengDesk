import { useEffect, type CSSProperties } from "react";
import Navbar from "@/components/ui/Navbar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Footer from "@/components/ui/Footer";
import { Toaster } from "sonner";
import { ChatWidget } from "@/features/chatbox";
import { useAppSelector } from "@/app/store";
import BackToTopButton from "@/components/ui/BackToTopButton";

const toasterStyle = { "--width": "min(100vw - 1.5rem, 356px)" } as CSSProperties;

// Cờ cấp MODULE: chỉ reset khi reload trang thật (module re-evaluate), KHÔNG reset khi điều hướng nội bộ
// (AppLayout remount lúc đi /manager → "/"). Nhờ đó staff bấm logo về "/" KHÔNG bị đá lại /manager.
let initRedirectDone = false;

export default function AppLayout() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Khi MỞ LẠI app (reload): nếu đã đăng nhập Staff/Manager/Admin và đang ở trang chủ "/" → đưa về /manager
  // (đồng bộ với redirect sau khi login). Chỉ chạy 1 lần lúc khởi động phiên.
  useEffect(() => {
    if (initRedirectDone) return;
    initRedirectDone = true;
    const roles = (user?.role ?? "").split(",").map((r) => r.trim());
    const isStaffOrAbove = roles.some((r) => r === "Staff" || r === "Manager" || r === "Admin");
    if (isStaffOrAbove && pathname === "/") navigate("/manager", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip">
      <Navbar />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
      <Footer />
      <ChatWidget />
      <BackToTopButton />
      <Toaster
        richColors
        closeButton
        position="top-right"
        className="top-[max(0.75rem,env(safe-area-inset-top))]! right-[max(0.75rem,env(safe-area-inset-right))]! sm:top-4! sm:right-4!"
        style={toasterStyle}
      />
    </div>
  );
}
