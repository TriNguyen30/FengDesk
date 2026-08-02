import { Shield } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Shield size={64} className="text-slate-300" />
      <h2 className="text-2xl font-semibold text-slate-800">Trang quản trị hệ thống</h2>
      <p className="text-slate-500 max-w-md text-center">
        Chào mừng bạn đến với khu vực quản trị. Vui lòng chọn chức năng từ menu bên trái để bắt đầu thao tác với hệ thống.
      </p>
    </div>
  );
}
