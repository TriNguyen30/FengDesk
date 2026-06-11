import type { CSSProperties } from "react";
import Navbar from "@/components/ui/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "@/components/ui/Footer";
import { Toaster } from "sonner";

const toasterStyle = { "--width": "min(100vw - 1.5rem, 356px)" } as CSSProperties;

export default function AppLayout() {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip">
      <Navbar />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
      <Footer />
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
