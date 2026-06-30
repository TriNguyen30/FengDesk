import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { logout } from "@/features/auth/store/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { logoutRequest } from "@/features/auth/api/auth.api";
import { clearSession } from "@/utils";

export default function ProfileInfoPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { refreshToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
      navigate("/");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Thông tin tài khoản</h1>

      <div className="space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
            {user.fullName ? user.fullName.charAt(12).toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user.fullName || "Người dùng"}</h2>
            <p className="text-sm text-gray-500">
              {user.role === "Customer" ? "Khách hàng" : "Nhân viên"}
            </p>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text"
              disabled
              defaultValue={user.fullName || ""}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              disabled
              defaultValue={user.email || ""}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              disabled
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
            >
              Cập nhật thông tin
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Tính năng cập nhật thông tin đang được phát triển.
          </p>
        </form>
      </div>
    </div>
  );
}
