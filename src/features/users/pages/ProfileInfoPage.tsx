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
import { useTranslation } from "react-i18next";

export default function ProfileInfoPage() {
  const { t } = useTranslation();
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
        toast.success(res.message || t("profile_info.toast.birth_time_success"));
        queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      } else {
        toast.error(res.message || t("profile_info.toast.birth_time_error"));
      }
    } catch {
      toast.error(t("profile_info.toast.birth_time_error"));
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
      toast.success(t("profile_info.toast.logout_success"));
      navigate("/");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (isLoading) {
    return <div className="w-full animate-pulse space-y-6">{t("profile_info.loading")}</div>;
  }

  if (!profile) return null;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">{t("profile_info.title")}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {t("profile_info.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile.fullName || t("profile_info.default_user")}
            </h2>
            <p className="text-sm text-gray-500">
              {profile.role === "Customer" ? t("profile_info.roles.customer") : t("profile_info.roles.staff")}
            </p>
          </div>
        </div>

        <form className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("profile_info.fields.fullname")}</label>
            <input
              type="text"
              disabled
              defaultValue={profile.fullName || ""}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("profile_info.fields.email")}</label>
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
                {t("profile_info.fields.phone")}
              </label>
              <input
                type="text"
                disabled
                defaultValue={profile.phone || t("profile_info.values.not_updated")}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("profile_info.fields.gender")}</label>
              <input
                type="text"
                disabled
                defaultValue={
                  profile.gender === "Male"
                    ? t("profile_info.values.male")
                    : profile.gender === "Female"
                      ? t("profile_info.values.female")
                      : t("profile_info.values.not_updated")
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t("profile_info.fields.dob")}</label>
              <input
                type="text"
                disabled
                defaultValue={
                  profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")
                    : t("profile_info.values.not_updated")
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t("profile_info.fields.element")}
              </label>
              <input
                type="text"
                disabled
                defaultValue={
                  profile.fengShui?.element === "Kim"
                    ? t("profile_info.values.metal")
                    : profile.fengShui?.element === "Moc"
                      ? t("profile_info.values.wood")
                      : profile.fengShui?.element === "Thuy"
                        ? t("profile_info.values.water")
                        : profile.fengShui?.element === "Hoa"
                          ? t("profile_info.values.fire")
                          : profile.fengShui?.element === "Tho"
                            ? t("profile_info.values.earth")
                            : t("profile_info.values.not_updated")
                }
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Giờ sinh — sửa được: trợ lý AI dùng để luận đủ Tứ Trụ/Bát Tự */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("profile_info.fields.birth_time")} <span className="font-normal text-gray-400">{t("profile_info.fields.optional")}</span>
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
                {savingBirthTime ? t("profile_info.actions.saving") : t("profile_info.actions.save")}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {t("profile_info.hints.birth_time")}
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              disabled
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
            >
              {t("profile_info.actions.update")}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              {t("profile_info.actions.logout")}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {t("profile_info.hints.update_wip")}
          </p>
        </form>
      </div>
    </div>
  );
}
