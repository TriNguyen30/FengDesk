import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { logout } from "@/features/auth/store/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  logoutRequest,
  myProfileRequest,
  updateBirthTimeRequest,
} from "@/features/auth/api/auth.api";
import { clearSession } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ProfileInfoPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { refreshToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["myProfile"],
    queryFn: myProfileRequest,
  });

  const profile = profileResponse?.data || user;
  const queryClient = useQueryClient();

  // Giờ sinh — field DUY NHẤT sửa được ở màn này (phục vụ Tứ Trụ/Bát Tự trong chat AI).
  const [birthTime, setBirthTime] = useState("");
  const [savingBirthTime, setSavingBirthTime] = useState(false);
  const savedBirthTime =
    profileResponse?.data && "birthTime" in profileResponse.data
      ? (profileResponse.data.birthTime?.slice(0, 5) ?? "")
      : "";

  useEffect(() => {
    setBirthTime(savedBirthTime);
  }, [savedBirthTime]);

  const handleSaveBirthTime = async () => {
    setSavingBirthTime(true);
    try {
      const res = await updateBirthTimeRequest(birthTime || null);
      if (res.isSuccess) {
        toast.success(res.message || "Đã cập nhật giờ sinh");
        queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      } else {
        toast.error(res.message || "Không cập nhật được giờ sinh");
      }
    } catch {
      toast.error("Không cập nhật được giờ sinh");
    } finally {
      setSavingBirthTime(false);
    }
  };

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

  if (isLoading) {
    return <div className="w-full animate-pulse space-y-6">Đang tải thông tin...</div>;
  }

  if (!profile) return null;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Thông tin tài khoản</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Quản lý thông tin cá nhân và thiết lập tài khoản của bạn.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile.fullName || "Người dùng"}
            </h2>
            <p className="text-sm text-gray-500">
              {profile.role === "Customer" ? "Khách hàng" : "Nhân viên"}
            </p>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text"
              disabled
              defaultValue={profile.fullName || ""}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              disabled
              defaultValue={profile.email || ""}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                type="text"
                disabled
                defaultValue={profile.phone || "Chưa cập nhật"}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Giới tính</label>
              <input
                type="text"
                disabled
                defaultValue={
                  profile.gender === "Male"
                    ? "Nam"
                    : profile.gender === "Female"
                      ? "Nữ"
                      : "Chưa cập nhật"
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Ngày sinh</label>
              <input
                type="text"
                disabled
                defaultValue={
                  profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Mệnh Phong Thuỷ
              </label>
              <input
                type="text"
                disabled
                defaultValue={
                  profile.fengShui?.element === "Kim"
                    ? "Kim"
                    : profile.fengShui?.element === "Moc"
                      ? "Mộc"
                      : profile.fengShui?.element === "Thuy"
                        ? "Thủy"
                        : profile.fengShui?.element === "Hoa"
                          ? "Hỏa"
                          : profile.fengShui?.element === "Tho"
                            ? "Thổ"
                            : "Chưa cập nhật"
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Giờ sinh — sửa được: trợ lý AI dùng để luận đủ Tứ Trụ/Bát Tự */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Giờ sinh <span className="font-normal text-gray-400">(tùy chọn)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                disabled={savingBirthTime}
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleSaveBirthTime}
                disabled={savingBirthTime || birthTime === savedBirthTime}
                className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
              >
                {savingBirthTime ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Thêm giờ sinh để trợ lý AI xem được Tứ Trụ / Bát Tự đầy đủ cho bạn.
            </p>
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
