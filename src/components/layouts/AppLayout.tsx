import { useEffect, type CSSProperties } from "react";
import Navbar from "@/components/ui/Navbar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Footer from "@/components/ui/Footer";
import { Toaster } from "sonner";
import { ChatWidget } from "@/features/chatbox";
import { useAppSelector } from "@/app/store";
import BackToTopButton from "@/components/ui/BackToTopButton";
import AsciiFluidBackground from "@/components/ui/AsciiFluidBackground";
import CategoryBar from "@/components/ui/CategoryBar";

const toasterStyle = { "--width": "min(100vw - 1.5rem, 356px)" } as CSSProperties;

// Cờ cấp MODULE: chỉ reset khi reload trang thật (module re-evaluate), KHÔNG reset khi điều hướng nội bộ
// (AppLayout remount lúc đi /manager → "/"). Nhờ đó staff bấm logo về "/" KHÔNG bị đá lại /manager.
let initRedirectDone = false;

export default function AppLayout() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();

  // Gom các route con của /profile vào một key để ProfileLayout không bị remount
  // (mất state sidebar + refetch) mỗi lần đổi tab trong trang cá nhân.
  const transitionKey = pathname.startsWith("/profile") ? "/profile" : pathname;

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
      {/* Nền fluid ASCII đặt ở layout (không phải từng page) để không bị remount
          khi đổi route — hiệu ứng chạy liên tục xuyên suốt các tab. */}
      <AsciiFluidBackground />

      {/* Navbar + CategoryBar là một khối header cố định dùng chung cho mọi trang;
          chỉ phần Outlet bên dưới đổi nội dung khi điều hướng. */}
      <div className="sticky top-0 z-50 min-w-0">
        <Navbar />

        <div className="w-full min-w-0 border-b border-border-light/60 bg-neutral/80 backdrop-blur-md">
          <CategoryBar />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={transitionKey}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
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
